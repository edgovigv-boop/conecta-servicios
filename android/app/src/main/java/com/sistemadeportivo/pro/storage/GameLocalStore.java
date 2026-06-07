package com.sistemadeportivo.pro.storage;

import android.content.Context;
import android.content.SharedPreferences;

import com.sistemadeportivo.pro.model.EventType;
import com.sistemadeportivo.pro.model.GameEvent;
import com.sistemadeportivo.pro.model.GameState;
import com.sistemadeportivo.pro.model.TeamSide;
import com.sistemadeportivo.pro.model.TeamState;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class GameLocalStore {
    private static final String KEY_CURRENT = "current_game";
    private static final String KEY_FINISHED = "finished_games";
    private final SharedPreferences prefs;

    public GameLocalStore(Context context) {
        prefs = context.getSharedPreferences("sistema_deportivo_pro_v2", Context.MODE_PRIVATE);
    }

    public GameState loadCurrentGame() {
        try {
            String raw = prefs.getString(KEY_CURRENT, null);
            return raw == null ? new GameState() : decodeGame(new JSONObject(raw));
        } catch (Exception error) {
            return new GameState();
        }
    }

    public void saveCurrentGame(GameState state) {
        prefs.edit().putString(KEY_CURRENT, encodeGame(state).toString()).apply();
    }

    public List<GameState> loadFinishedGames() {
        ArrayList<GameState> games = new ArrayList<>();
        try {
            JSONArray array = new JSONArray(prefs.getString(KEY_FINISHED, "[]"));
            for (int index = 0; index < array.length(); index++) games.add(decodeGame(array.getJSONObject(index)));
        } catch (Exception ignored) { }
        return games;
    }

    public void saveFinishedGame(GameState state) {
        List<GameState> existing = loadFinishedGames();
        JSONArray array = new JSONArray();
        array.put(encodeGame(state));
        int count = 1;
        for (GameState game : existing) {
            if (!game.id.equals(state.id) && count < 30) {
                array.put(encodeGame(game));
                count++;
            }
        }
        prefs.edit().putString(KEY_FINISHED, array.toString()).apply();
    }

    private static JSONObject encodeTeam(TeamState team) {
        return new JSONObject().put("name", team.name).put("color", team.color).put("score", team.score).put("fouls", team.fouls);
    }

    private static TeamState decodeTeam(JSONObject json, String fallback, int color) {
        TeamState team = new TeamState(json.optString("name", fallback), json.optInt("color", color));
        team.score = json.optInt("score", 0);
        team.fouls = json.optInt("fouls", 0);
        return team;
    }

    private static JSONObject encodeEvent(GameEvent event) {
        return new JSONObject()
                .put("id", event.id)
                .put("timestamp", event.timestamp)
                .put("gameClockSeconds", event.gameClockSeconds)
                .put("period", event.period)
                .put("team", event.team == null ? JSONObject.NULL : event.team.name())
                .put("playerName", event.playerName)
                .put("playerNumber", event.playerNumber)
                .put("playerIsFemale", event.playerIsFemale)
                .put("type", event.type.name())
                .put("pointsAdded", event.pointsAdded)
                .put("homeScoreAfter", event.homeScoreAfter)
                .put("awayScoreAfter", event.awayScoreAfter)
                .put("textOriginal", event.textOriginal);
    }

    private static GameEvent decodeEvent(JSONObject json) {
        GameEvent event = new GameEvent();
        event.id = json.optString("id", event.id);
        event.timestamp = json.optLong("timestamp", event.timestamp);
        event.gameClockSeconds = json.optInt("gameClockSeconds", 0);
        event.period = json.optInt("period", 1);
        String team = json.optString("team", "");
        event.team = team.isEmpty() || "null".equals(team) ? null : TeamSide.valueOf(team);
        event.playerName = json.optString("playerName", "");
        event.playerNumber = json.optString("playerNumber", "");
        event.playerIsFemale = json.optBoolean("playerIsFemale", false);
        event.type = EventType.valueOf(json.optString("type", EventType.SCORE.name()));
        event.pointsAdded = json.optInt("pointsAdded", 0);
        event.homeScoreAfter = json.optInt("homeScoreAfter", 0);
        event.awayScoreAfter = json.optInt("awayScoreAfter", 0);
        event.textOriginal = json.optString("textOriginal", "");
        return event;
    }

    private static JSONObject encodeGame(GameState state) {
        JSONArray events = new JSONArray();
        for (GameEvent event : state.events) events.put(encodeEvent(event));
        return new JSONObject()
                .put("id", state.id)
                .put("title", state.title)
                .put("home", encodeTeam(state.home))
                .put("away", encodeTeam(state.away))
                .put("period", state.period)
                .put("totalPeriods", state.totalPeriods)
                .put("periodLengthSeconds", state.periodLengthSeconds)
                .put("clockSeconds", state.clockSeconds)
                .put("isClockRunning", state.isClockRunning)
                .put("isFinished", state.isFinished)
                .put("lastPlay", state.lastPlay)
                .put("events", events)
                .put("createdAt", state.createdAt)
                .put("updatedAt", state.updatedAt)
                .put("videoAssetUri", state.videoAssetUri == null ? JSONObject.NULL : state.videoAssetUri);
    }

    private static GameState decodeGame(JSONObject json) {
        GameState state = new GameState();
        state.id = json.optString("id", state.id);
        state.title = json.optString("title", state.title);
        state.home = decodeTeam(json.optJSONObject("home") == null ? new JSONObject() : json.optJSONObject("home"), "Equipo A", 0xFF2563EB);
        state.away = decodeTeam(json.optJSONObject("away") == null ? new JSONObject() : json.optJSONObject("away"), "Equipo B", 0xFFDC2626);
        state.period = json.optInt("period", 1);
        state.totalPeriods = json.optInt("totalPeriods", 4);
        state.periodLengthSeconds = json.optInt("periodLengthSeconds", 600);
        state.clockSeconds = json.optInt("clockSeconds", 600);
        state.isClockRunning = json.optBoolean("isClockRunning", false);
        state.isFinished = json.optBoolean("isFinished", false);
        state.lastPlay = json.optString("lastPlay", state.lastPlay);
        state.createdAt = json.optLong("createdAt", state.createdAt);
        state.updatedAt = json.optLong("updatedAt", state.updatedAt);
        state.videoAssetUri = json.optString("videoAssetUri", null);
        JSONArray events = json.optJSONArray("events");
        state.events = new ArrayList<>();
        if (events != null) {
            for (int index = 0; index < events.length(); index++) state.events.add(decodeEvent(events.getJSONObject(index)));
        }
        return state;
    }
}
