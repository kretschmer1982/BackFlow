import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type WeekDatum = { year: number; week: number; count: number };

type Props = {
  weeks: WeekDatum[];
  yAxisMax: number;
  yTicks: number[];
  accentColor: string;
  height: number;
  topPadding?: number;
};

export function MonthlyTrainingBarChart({
  weeks,
  yAxisMax,
  yTicks,
  accentColor,
  height,
  topPadding = 0,
}: Props) {
  const safeMax = Math.max(1, yAxisMax || 1);
  const hasData = weeks.length > 0;

  return (
    <View style={styles.root}>
      <View style={[styles.plotRow, { paddingTop: topPadding }]}>
        {/* Y-Achse + Grid (Plot-Höhe ist exakt "height") */}
        <View style={[styles.yAxis, { height }]}>
          {yTicks.map((t) => {
            const ratio = Math.max(0, Math.min(1, t / safeMax));
            // 0 -> unten, max -> oben
            const y = (1 - ratio) * height;
            return (
              <View key={`y-${t}`} style={styles.yTickLayer}>
                {/* Gridline exakt auf y */}
                <View style={[styles.yGridLineAbs, { top: y }]} />
                {/* Label optisch zentriert zur Gridline */}
                <Text style={[styles.yTickLabelAbs, { top: y }]}>
                  {t}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Bars (Plot-Höhe ist exakt "height") */}
        <View style={styles.barsArea}>
          {!hasData ? (
            <View style={[styles.emptyState, { height }]}>
              <Text style={styles.emptyStateText}>
                Keine durchgeführten Trainings in diesem Monat.
              </Text>
            </View>
          ) : (
            <View style={[styles.barsRow, { height }]}>
              {weeks.map((w) => {
                const h = Math.max(0, Math.min(1, w.count / safeMax));
                return (
                  <View key={`${w.year}-W${w.week}`} style={styles.barGroupPlot}>
                    <View style={[styles.barTrack, { height }]}>
                      <View
                        style={[
                          styles.barFill,
                          { height: `${h * 100}%`, backgroundColor: accentColor },
                        ]}
                      />
                      {/* Border als Overlay, damit die Füllung bis zur obersten Gridline reichen kann */}
                      <View pointerEvents="none" style={styles.barBorder} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>

      {/* X-Achse (unterhalb des Plot-Bereichs, beeinflusst die Balkenhöhe nicht) */}
      {hasData ? (
        <View style={styles.xAxisRow}>
          {/* Spacer für Y-Achse */}
          <View style={styles.yAxisSpacer} />
          <View style={styles.xLabelsRow}>
            {weeks.map((w) => (
              <View key={`x-${w.year}-W${w.week}`} style={styles.xLabelWrap}>
                <Text style={styles.xLabel} numberOfLines={1}>
                  KW {w.week}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const Y_AXIS_W = 44;
const BAR_GROUP_W = 44;
const BAR_W = 18;
const GAP = 10;
const LABEL_W = 22;
const LABEL_LINE_H = 14;

const styles = StyleSheet.create({
  root: {},

  plotRow: { flexDirection: 'row' },

  yAxis: { width: Y_AXIS_W, paddingRight: 8, position: 'relative' },
  // Layer, damit Label und Linie getrennt exakt positioniert werden können
  yTickLayer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  yGridLineAbs: { position: 'absolute', left: LABEL_W + 8, right: 0, height: 1, backgroundColor: '#2b2b2b' },
  yTickLabelAbs: {
    position: 'absolute',
    left: 0,
    width: LABEL_W,
    textAlign: 'right',
    color: '#8a8a8a',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: LABEL_LINE_H,
    transform: [{ translateY: -LABEL_LINE_H / 2 }],
  },

  barsArea: { flex: 1 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: GAP, paddingRight: 6 },
  barGroupPlot: { width: BAR_GROUP_W, alignItems: 'center', justifyContent: 'flex-end' },
  barTrack: {
    width: BAR_W,
    borderRadius: 10,
    backgroundColor: '#121212',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: { width: '100%' },
  barBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2b2b2b',
  },

  xAxisRow: { flexDirection: 'row', marginTop: 6 },
  yAxisSpacer: { width: Y_AXIS_W },
  xLabelsRow: { flex: 1, flexDirection: 'row', gap: GAP, paddingRight: 6 },
  xLabelWrap: { width: BAR_GROUP_W, alignItems: 'center' },
  xLabel: { color: '#8a8a8a', fontSize: 11, fontWeight: '800' },

  emptyState: { justifyContent: 'center', alignItems: 'center' },
  emptyStateText: { color: '#8a8a8a', fontSize: 12, fontWeight: '700', textAlign: 'center' },
});


