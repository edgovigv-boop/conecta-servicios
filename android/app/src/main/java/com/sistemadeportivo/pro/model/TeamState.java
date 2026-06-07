package com.sistemadeportivo.pro.model;

public class TeamState {
    public String name;
    public int color;
    public int score;
    public int fouls;

    public TeamState(String name, int color) {
        this.name = name;
        this.color = color;
    }

    public TeamState copy() {
        TeamState next = new TeamState(name, color);
        next.score = score;
        next.fouls = fouls;
        return next;
    }
}
