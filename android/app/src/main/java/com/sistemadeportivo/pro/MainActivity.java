package com.sistemadeportivo.pro;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Switch;
import android.widget.TextView;

import com.sistemadeportivo.pro.engine.ScoreEngine;
import com.sistemadeportivo.pro.model.EventType;
import com.sistemadeportivo.pro.model.GameEvent;
import com.sistemadeportivo.pro.model.GameState;
import com.sistemadeportivo.pro.model.TeamSide;
import com.sistemadeportivo.pro.model.TeamState;
import com.sistemadeportivo.pro.storage.GameLocalStore;

import java.util.List;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final int ARENA_BLACK = Color.rgb(2, 6, 23);
    private static final int CARD = Color.rgb(17, 24, 39);
    private static final int LIME = Color.rgb(163, 230, 53);
    private static final int WHITE = Color.WHITE;
    private static final int SLATE = Color.rgb(51, 65, 85);
    private static final int GREEN = Color.rgb(22, 163, 74);
    private static final int ORANGE = Color.rgb(249, 115, 22);
    private static final int RED = Color.rgb(220, 38, 38);
    private static final int PURPLE = Color.rgb(124, 58, 237);

    private GameLocalStore store;
    private GameState game;
    private TeamSide selectedTeam = TeamSide.HOME;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable ticker = new Runnable() {
        @Override public void run() {
            if (game != null && game.isClockRunning && !game.isFinished) {
                game = ScoreEngine.tickClock(game);
                saveGame();
                showScorer();
            }
            handler.postDelayed(this, 1000);
        }
    };

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        store = new GameLocalStore(this);
        game = store.loadCurrentGame();
        handler.post(ticker);
        showHome();
    }

    @Override protected void onDestroy() {
        handler.removeCallbacks(ticker);
        super.onDestroy();
    }

    private void saveGame() {
        store.saveCurrentGame(game);
        if (game.isFinished) store.saveFinishedGame(game);
    }

    private void showHome() {
        restoreSystemUi();
        LinearLayout root = shell();
        title(root, "Sistema Deportivo Pro V2", 32);
        label(root, "Marcador Profesional y Pantalla Pública Full Screen", LIME, 16, true);
        root.addView(scoreCard(false));
        root.addView(modeButton("Modo Anotador", "Registrar canastas, faltas y reloj en cancha", v -> showScorer()));
        root.addView(modeButton("Modo Pantalla Pública", "Marcador full screen tipo transmisión", v -> showPublicScreen()));
        root.addView(modeButton("Modo Partido / Configuración", "Equipos, duración y nuevo partido", v -> showSetup()));
        root.addView(modeButton("Modo Historial / Partidos guardados", "Marcadores finales y eventos locales", v -> showHistory()));
        card(root, "Conexión local preparada", "Si no hay pantalla conectada, el anotador sigue guardando el partido y sus eventos localmente.");
        setContentView(wrap(root));
    }

    private void showScorer() {
        restoreSystemUi();
        LinearLayout root = shell();
        top(root, "Modo Anotador");
        root.addView(scoreCard(false));

        LinearLayout teams = row();
        teams.addView(teamButton(game.home, TeamSide.HOME), weightParams(1));
        teams.addView(teamButton(game.away, TeamSide.AWAY), weightParams(1));
        root.addView(teams);

        EditText number = input("#", "");
        EditText player = input("Jugador/a", "");
        Switch female = new Switch(this);
        female.setText("Mujer = 3");
        female.setTextColor(WHITE);
        LinearLayout meta = row();
        meta.addView(number, weightParams(1));
        meta.addView(player, weightParams(2));
        meta.addView(female, weightParams(1));
        root.addView(meta);

        root.addView(actionRow(
                action("+1\nTiro libre", GREEN, v -> applyScore(EventType.FREE_THROW, player, number, female, false)),
                action("+2\nCanasta", Color.rgb(37, 99, 235), v -> applyScore(EventType.SCORE, player, number, female, false)),
                action("+3\nTriple", ORANGE, v -> applyScore(EventType.SCORE, player, number, female, true))
        ));
        root.addView(actionRow(
                action("F\nFalta", RED, v -> { game = ScoreEngine.addFoul(game, selectedTeam, player.getText().toString(), number.getText().toString()); saveGame(); showScorer(); }),
                action("↶\nDeshacer", SLATE, v -> { game = ScoreEngine.undoLast(game); saveGame(); showScorer(); }),
                action((game.isClockRunning ? "⏸\nPausar" : "▶\nReloj"), PURPLE, v -> { game = ScoreEngine.toggleClock(game); saveGame(); showScorer(); })
        ));
        root.addView(actionRow(
                action("Q+\nCambiar cuarto", SLATE, v -> { game = ScoreEngine.changePeriod(game); saveGame(); showScorer(); }),
                action("FIN\nFinalizar", RED, v -> { game = ScoreEngine.finishGame(game); saveGame(); showScorer(); })
        ));

        Button voice = button("🎙 Escuchar jugada", LIME, ARENA_BLACK);
        voice.setTextSize(20);
        voice.setOnClickListener(v -> { game.lastPlay = "Voz offline preparada: usa botones manuales si no reconoce la jugada."; saveGame(); showScorer(); });
        root.addView(voice, fullButtonParams());

        LinearLayout nav = row();
        nav.addView(outline("Pantalla pública", v -> showPublicScreen()), weightParams(1));
        nav.addView(outline("Overlay futuro", v -> showOverlay()), weightParams(1));
        root.addView(nav);

        recentEvents(root);
        setContentView(wrap(root));
    }

    private void applyScore(EventType type, EditText player, EditText number, Switch female, boolean triple) {
        game = ScoreEngine.addScore(game, selectedTeam, type, player.getText().toString(), number.getText().toString(), female.isChecked(), triple, triple ? "+3 triple" : type == EventType.FREE_THROW ? "+1 tiro libre" : "+2 canasta");
        saveGame();
        showScorer();
    }

    private void showPublicScreen() {
        fullScreenSystemUi();
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(18), dp(18), dp(18), dp(18));
        root.setBackgroundColor(ARENA_BLACK);
        TextView live = text("SISTEMA DEPORTIVO PRO · LIVE", LIME, 18, true);
        live.setGravity(Gravity.CENTER);
        root.addView(live, fullWidth());
        LinearLayout board = row();
        board.setGravity(Gravity.CENTER);
        board.addView(publicTeam(game.home), weightParams(1));
        board.addView(publicClock(), weightParams(1));
        board.addView(publicTeam(game.away), weightParams(1));
        root.addView(board, new LinearLayout.LayoutParams(-1, 0, 1));
        TextView last = text("ÚLTIMA JUGADA · " + game.lastPlay, WHITE, 24, true);
        last.setPadding(dp(16), dp(16), dp(16), dp(16));
        last.setBackgroundColor(CARD);
        root.addView(last, fullWidth());
        root.setOnLongClickListener(v -> { showHome(); return true; });
        setContentView(root);
    }

    private void showSetup() {
        restoreSystemUi();
        LinearLayout root = shell();
        top(root, "Modo Partido / Configuración");
        EditText home = input("Equipo A", game.home.name);
        EditText away = input("Equipo B", game.away.name);
        EditText minutes = input("Minutos por cuarto", String.valueOf(game.periodLengthSeconds / 60));
        root.addView(home); root.addView(away); root.addView(minutes);
        Button save = button("Guardar configuración", LIME, ARENA_BLACK);
        save.setOnClickListener(v -> { game = ScoreEngine.updateTeams(game, home.getText().toString(), away.getText().toString(), parseInt(minutes.getText().toString(), 10)); saveGame(); showHome(); });
        root.addView(save, fullButtonParams());
        Button fresh = button("Crear partido nuevo", Color.rgb(37, 99, 235), WHITE);
        fresh.setOnClickListener(v -> { game = new GameState(); saveGame(); showScorer(); });
        root.addView(fresh, fullButtonParams());
        setContentView(wrap(root));
    }

    private void showHistory() {
        restoreSystemUi();
        LinearLayout root = shell();
        top(root, "Historial / Partidos guardados");
        card(root, "Partido actual", game.home.name + " " + game.home.score + " - " + game.away.score + " " + game.away.name + "\nEventos: " + game.events.size());
        List<GameState> finished = store.loadFinishedGames();
        if (finished.isEmpty()) card(root, "Finalizados", "Aún no hay partidos finalizados guardados localmente.");
        for (GameState saved : finished) card(root, "Finalizado", saved.home.name + " " + saved.home.score + " - " + saved.away.score + " " + saved.away.name + "\nEventos: " + saved.events.size());
        setContentView(wrap(root));
    }

    private void showOverlay() {
        restoreSystemUi();
        LinearLayout root = shell();
        top(root, "Overlay / Transmisión futura");
        card(root, "Componente preparado", "Marcador compacto listo para ponerse encima de video en V3.");
        LinearLayout overlay = row();
        overlay.setPadding(dp(12), dp(12), dp(12), dp(12));
        overlay.setBackgroundColor(Color.rgb(15, 23, 42));
        overlay.addView(text(game.home.name + " " + game.home.score, WHITE, 18, true), weightParams(1));
        TextView clock = text(formatClock(game.clockSeconds) + " · Q" + game.period, LIME, 18, true);
        clock.setGravity(Gravity.CENTER);
        overlay.addView(clock, weightParams(1));
        TextView away = text(game.away.score + " " + game.away.name, WHITE, 18, true);
        away.setGravity(Gravity.RIGHT);
        overlay.addView(away, weightParams(1));
        root.addView(overlay, fullWidth());
        card(root, "V3 video", "• Asociar video grabado con partido\n• Exportar 16:9 para YouTube\n• Exportar 9:16 para redes\n• Crear resumen de jugadas destacadas");
        setContentView(wrap(root));
    }

    private LinearLayout scoreCard(boolean compact) {
        LinearLayout box = cardBox();
        LinearLayout row = row();
        row.addView(miniScore(game.home), weightParams(1));
        TextView clock = text(formatClock(game.clockSeconds) + "\nQ" + game.period, WHITE, compact ? 18 : 28, true);
        clock.setGravity(Gravity.CENTER);
        row.addView(clock, weightParams(1));
        row.addView(miniScore(game.away), weightParams(1));
        box.addView(row);
        label(box, "Última jugada: " + game.lastPlay, WHITE, 14, false);
        return box;
    }

    private LinearLayout miniScore(TeamState team) {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER);
        label(box, team.name, WHITE, 16, true);
        label(box, String.valueOf(team.score), team.color, 44, true);
        label(box, "Faltas " + team.fouls, Color.LTGRAY, 13, true);
        return box;
    }

    private LinearLayout publicTeam(TeamState team) {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER);
        box.setBackgroundColor(Color.argb(55, Color.red(team.color), Color.green(team.color), Color.blue(team.color)));
        box.setPadding(dp(12), dp(12), dp(12), dp(12));
        label(box, team.name.toUpperCase(Locale.ROOT), WHITE, 30, true);
        label(box, String.valueOf(team.score), WHITE, 104, true);
        label(box, "FALTAS " + team.fouls, LIME, 22, true);
        return box;
    }

    private LinearLayout publicClock() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER);
        label(box, formatClock(game.clockSeconds), WHITE, 50, true);
        label(box, "PERIODO " + game.period, LIME, 24, true);
        label(box, game.isClockRunning ? "EN JUEGO" : "PAUSADO", game.isClockRunning ? GREEN : ORANGE, 16, true);
        return box;
    }

    private void recentEvents(LinearLayout root) {
        LinearLayout box = cardBox();
        label(box, "Historial reciente", LIME, 18, true);
        int start = Math.max(0, game.events.size() - 8);
        if (game.events.isEmpty()) label(box, "Sin jugadas todavía.", WHITE, 14, false);
        for (int i = game.events.size() - 1; i >= start; i--) {
            GameEvent e = game.events.get(i);
            label(box, "Q" + e.period + " · " + formatClock(e.gameClockSeconds) + " · " + e.type + " · " + e.textOriginal + " · " + e.homeScoreAfter + "-" + e.awayScoreAfter, Color.LTGRAY, 13, false);
        }
        root.addView(box);
    }

    private Button teamButton(TeamState team, TeamSide side) {
        Button button = button(team.name, selectedTeam == side ? team.color : SLATE, WHITE);
        button.setOnClickListener(v -> { selectedTeam = side; showScorer(); });
        return button;
    }

    private Button action(String label, int color, View.OnClickListener listener) { Button b = button(label, color, WHITE); b.setOnClickListener(listener); return b; }
    private LinearLayout actionRow(View... views) { LinearLayout row = row(); for (View view : views) row.addView(view, weightParams(1)); return row; }

    private LinearLayout shell() { LinearLayout root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setPadding(dp(16), dp(16), dp(16), dp(16)); root.setBackgroundColor(ARENA_BLACK); return root; }
    private ScrollView wrap(LinearLayout root) { ScrollView scroll = new ScrollView(this); scroll.setBackgroundColor(ARENA_BLACK); scroll.addView(root); return scroll; }
    private LinearLayout row() { LinearLayout row = new LinearLayout(this); row.setOrientation(LinearLayout.HORIZONTAL); row.setGravity(Gravity.CENTER_VERTICAL); row.setPadding(0, dp(5), 0, dp(5)); return row; }
    private LinearLayout cardBox() { LinearLayout box = new LinearLayout(this); box.setOrientation(LinearLayout.VERTICAL); box.setPadding(dp(14), dp(14), dp(14), dp(14)); box.setBackgroundColor(CARD); box.setGravity(Gravity.CENTER); box.setLayoutParams(new LinearLayout.LayoutParams(-1, -2)); return box; }
    private void card(LinearLayout root, String title, String body) { LinearLayout box = cardBox(); label(box, title, LIME, 18, true); label(box, body, WHITE, 15, false); root.addView(box); }
    private void title(LinearLayout root, String value, int size) { label(root, value, WHITE, size, true); }
    private void top(LinearLayout root, String value) { Button back = outline("← Inicio", v -> showHome()); root.addView(back, new LinearLayout.LayoutParams(-2, dp(48))); title(root, value, 26); }
    private void label(LinearLayout root, String value, int color, int size, boolean bold) { root.addView(text(value, color, size, bold)); }
    private TextView text(String value, int color, int size, boolean bold) { TextView t = new TextView(this); t.setText(value); t.setTextColor(color); t.setTextSize(size); t.setPadding(dp(4), dp(4), dp(4), dp(4)); if (bold) t.setTypeface(Typeface.DEFAULT, Typeface.BOLD); return t; }
    private Button button(String text, int bg, int fg) { Button b = new Button(this); b.setText(text); b.setTextColor(fg); b.setTextSize(16); b.setTypeface(Typeface.DEFAULT, Typeface.BOLD); b.setBackgroundColor(bg); b.setAllCaps(false); return b; }
    private Button outline(String text, View.OnClickListener listener) { Button b = button(text, SLATE, WHITE); b.setOnClickListener(listener); return b; }
    private Button modeButton(String title, String subtitle, View.OnClickListener listener) { Button b = button(title + "\n" + subtitle, CARD, WHITE); b.setGravity(Gravity.LEFT | Gravity.CENTER_VERTICAL); b.setOnClickListener(listener); return b; }
    private EditText input(String hint, String value) { EditText e = new EditText(this); e.setHint(hint); e.setText(value); e.setSingleLine(true); e.setTextColor(WHITE); e.setHintTextColor(Color.LTGRAY); e.setBackgroundColor(Color.rgb(15, 23, 42)); e.setPadding(dp(10), 0, dp(10), 0); return e; }
    private LinearLayout.LayoutParams fullWidth() { LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(-1, -2); p.setMargins(0, dp(6), 0, dp(6)); return p; }
    private LinearLayout.LayoutParams fullButtonParams() { LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(-1, dp(62)); p.setMargins(0, dp(6), 0, dp(6)); return p; }
    private LinearLayout.LayoutParams weightParams(int weight) { LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(0, -2, weight); p.setMargins(dp(4), dp(4), dp(4), dp(4)); return p; }
    private int dp(int value) { return (int) (value * getResources().getDisplayMetrics().density + 0.5f); }
    private int parseInt(String value, int fallback) { try { return Integer.parseInt(value); } catch (Exception error) { return fallback; } }
    private String formatClock(int seconds) { int safe = Math.max(0, seconds); return String.format(Locale.ROOT, "%02d:%02d", safe / 60, safe % 60); }
    private void fullScreenSystemUi() { Window window = getWindow(); window.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION); }
    private void restoreSystemUi() { getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE); }
}
