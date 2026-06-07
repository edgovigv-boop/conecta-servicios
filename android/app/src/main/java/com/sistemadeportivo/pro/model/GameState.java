package com.sistemadeportivo.pro.model;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class GameState {
    public String id = UUID.randomUUID().toString();
    public String title = "Sistema Deportivo Pro V2";
    public TeamState home = new TeamState("Equipo A", 0xFF2563EB);
    public TeamState away = new TeamState("Equipo B", 0xFFDC2626);
    public int period = 1;
    public int totalPeriods = 4;
    public int periodLengthSeconds = 10 * 60;
    public int clockSeconds = 10 * 60;
    public boolean isClockRunning;
    public boolean isFinished;
    public String lastPlay = "Listo para iniciar partido";
    public List<GameEvent> events = new ArrayList<>();
    public long createdAt = System.currentTimeMillis();
    public long updatedAt = System.currentTimeMillis();
    public String videoAssetUri;
}
