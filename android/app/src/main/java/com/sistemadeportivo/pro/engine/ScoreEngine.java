package com.sistemadeportivo.pro.engine;

import com.sistemadeportivo.pro.model.EventType;
import com.sistemadeportivo.pro.model.GameEvent;
import com.sistemadeportivo.pro.model.GameState;
import com.sistemadeportivo.pro.model.TeamSide;

public final class ScoreEngine {
    private ScoreEngine() {}

    public static int pointsFor(EventType action, boolean isFemale, boolean isTriple) {
        if (action == EventType.FREE_THROW) return 1;
        if (action != EventType.SCORE) return 0;
        if (isTriple || isFemale) return 3;
        return 2;
    }

    public static GameState addScore(GameState state, TeamSide team, EventType action, String playerName, String playerNumber, boolean isFemale, boolean isTriple, String textOriginal) {
        int points = pointsFor(action, isFemale, isTriple);
        if (team == TeamSide.HOME) state.home.score += points; else state.away.score += points;
        state.lastPlay = "+" + points + " " + teamName(state, team) + " · " + scoreReason(action, isFemale, isTriple) + playerLabel(playerName, playerNumber);
        state.updatedAt = System.currentTimeMillis();
        GameEvent event = baseEvent(state, team, action, textOriginal);
        event.playerName = safe(playerName);
        event.playerNumber = safe(playerNumber);
        event.playerIsFemale = isFemale;
        event.pointsAdded = points;
        state.events.add(event);
        return state;
    }

    public static GameState addFoul(GameState state, TeamSide team, String playerName, String playerNumber) {
        if (team == TeamSide.HOME) state.home.fouls += 1; else state.away.fouls += 1;
        state.lastPlay = "Falta de " + teamName(state, team) + playerLabel(playerName, playerNumber);
        state.updatedAt = System.currentTimeMillis();
        GameEvent event = baseEvent(state, team, EventType.FOUL, "Falta manual");
        event.playerName = safe(playerName);
        event.playerNumber = safe(playerNumber);
        state.events.add(event);
        return state;
    }

    public static GameState undoLast(GameState state) {
        for (int i = state.events.size() - 1; i >= 0; i--) {
            GameEvent last = state.events.get(i);
            if (last.type == EventType.SCORE || last.type == EventType.FREE_THROW || last.type == EventType.FOUL) {
                if (last.team == TeamSide.HOME && (last.type == EventType.SCORE || last.type == EventType.FREE_THROW)) state.home.score = Math.max(0, state.home.score - last.pointsAdded);
                if (last.team == TeamSide.AWAY && (last.type == EventType.SCORE || last.type == EventType.FREE_THROW)) state.away.score = Math.max(0, state.away.score - last.pointsAdded);
                if (last.team == TeamSide.HOME && last.type == EventType.FOUL) state.home.fouls = Math.max(0, state.home.fouls - 1);
                if (last.team == TeamSide.AWAY && last.type == EventType.FOUL) state.away.fouls = Math.max(0, state.away.fouls - 1);
                state.lastPlay = "Deshecho: " + last.textOriginal;
                state.updatedAt = System.currentTimeMillis();
                state.events.add(baseEvent(state, last.team, EventType.UNDO, "Deshacer última jugada"));
                return state;
            }
        }
        state.lastPlay = "No hay jugada para deshacer";
        return state;
    }

    public static GameState toggleClock(GameState state) {
        state.isClockRunning = !state.isClockRunning;
        state.lastPlay = state.isClockRunning ? "Reloj reanudado" : "Reloj pausado";
        state.updatedAt = System.currentTimeMillis();
        state.events.add(baseEvent(state, null, EventType.CLOCK_TOGGLE, state.lastPlay));
        return state;
    }

    public static GameState tickClock(GameState state) {
        if (state.isClockRunning && !state.isFinished && state.clockSeconds > 0) {
            state.clockSeconds -= 1;
            state.updatedAt = System.currentTimeMillis();
        }
        return state;
    }

    public static GameState changePeriod(GameState state) {
        if (state.period < state.totalPeriods) state.period += 1;
        state.clockSeconds = state.periodLengthSeconds;
        state.isClockRunning = false;
        state.home.fouls = 0;
        state.away.fouls = 0;
        state.lastPlay = "Cambio a periodo " + state.period;
        state.events.add(baseEvent(state, null, EventType.PERIOD_CHANGE, "Cambiar cuarto"));
        state.updatedAt = System.currentTimeMillis();
        return state;
    }

    public static GameState finishGame(GameState state) {
        state.isFinished = true;
        state.isClockRunning = false;
        state.lastPlay = "Partido finalizado";
        state.updatedAt = System.currentTimeMillis();
        state.events.add(baseEvent(state, null, EventType.GAME_END, "Finalizar partido"));
        return state;
    }

    public static GameState updateTeams(GameState state, String home, String away, int periodMinutes) {
        state.home.name = home == null || home.trim().isEmpty() ? "Equipo A" : home.trim();
        state.away.name = away == null || away.trim().isEmpty() ? "Equipo B" : away.trim();
        int seconds = Math.max(1, Math.min(15, periodMinutes)) * 60;
        state.periodLengthSeconds = seconds;
        if (state.events.isEmpty()) state.clockSeconds = seconds;
        state.updatedAt = System.currentTimeMillis();
        return state;
    }

    private static GameEvent baseEvent(GameState state, TeamSide team, EventType type, String textOriginal) {
        GameEvent event = new GameEvent();
        event.gameClockSeconds = state.clockSeconds;
        event.period = state.period;
        event.team = team;
        event.type = type;
        event.homeScoreAfter = state.home.score;
        event.awayScoreAfter = state.away.score;
        event.textOriginal = textOriginal;
        return event;
    }

    private static String scoreReason(EventType action, boolean isFemale, boolean isTriple) {
        if (action == EventType.FREE_THROW) return "tiro libre";
        if (isTriple) return "triple";
        if (isFemale) return "canasta mujer";
        return "canasta";
    }

    private static String teamName(GameState state, TeamSide team) { return team == TeamSide.HOME ? state.home.name : state.away.name; }
    private static String playerLabel(String name, String number) { return (safe(name).isEmpty() ? "" : " " + safe(name)) + (safe(number).isEmpty() ? "" : " #" + safe(number)); }
    private static String safe(String value) { return value == null ? "" : value.trim(); }
}
