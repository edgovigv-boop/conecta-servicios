package com.sistemadeportivo.pro.model;

import java.util.UUID;

public class GameEvent {
    public String id = UUID.randomUUID().toString();
    public long timestamp = System.currentTimeMillis();
    public int gameClockSeconds;
    public int period;
    public TeamSide team;
    public String playerName = "";
    public String playerNumber = "";
    public boolean playerIsFemale;
    public EventType type;
    public int pointsAdded;
    public int homeScoreAfter;
    public int awayScoreAfter;
    public String textOriginal = "";
}
