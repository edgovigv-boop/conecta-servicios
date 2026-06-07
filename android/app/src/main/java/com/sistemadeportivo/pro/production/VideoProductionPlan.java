package com.sistemadeportivo.pro.production;

import com.sistemadeportivo.pro.model.GameEvent;
import com.sistemadeportivo.pro.model.GameState;

import java.util.ArrayList;
import java.util.List;

/**
 * V3 preparation module for sports production workflows.
 * Future responsibilities:
 * - Associate a recorded local video with a saved game.
 * - Render the compact scoreboard overlay on top of the video timeline.
 * - Export 16:9 full-game videos and 9:16 vertical highlight clips.
 * - Create automatic recap packages from GameEvent moments.
 */
public final class VideoProductionPlan {
    private VideoProductionPlan() {}

    public enum OutputAspect { LANDSCAPE_16_9, VERTICAL_9_16 }

    public static final class VideoProject {
        public final String gameId;
        public final String sourceVideoUri;
        public final OutputAspect outputAspect;
        public final List<GameEvent> highlightEvents;

        public VideoProject(String gameId, String sourceVideoUri, OutputAspect outputAspect, List<GameEvent> highlightEvents) {
            this.gameId = gameId;
            this.sourceVideoUri = sourceVideoUri;
            this.outputAspect = outputAspect;
            this.highlightEvents = highlightEvents;
        }
    }

    public static VideoProject prepareProject(GameState game, String sourceVideoUri, OutputAspect aspect) {
        List<GameEvent> highlights = new ArrayList<>();
        for (GameEvent event : game.events) if (event.pointsAdded > 0) highlights.add(event);
        return new VideoProject(game.id, sourceVideoUri, aspect, highlights);
    }
}
