import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FavoriteButton } from '../components/FavoriteButton';
import { UpdatedAgo } from '../components/UpdatedAgo';
import { MATCHES_URL } from '../config';
import { useFavorites } from '../hooks/useFavorites';

type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed' | string;

type Team = {
  id: string;
  name: string;
  city: string;
};

type Match = {
  id: string;
  startsAt: string | null;
  status: MatchStatus;
  minute?: number;
  home: Team;
  away: Team;
  score: { home: number; away: number } | null;
};

type MatchesResponse = {
  round: number;
  matches: Match[];
};

type Filter = 'all' | 'scheduled' | 'finished';

const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'scheduled', label: 'Предстоящие' },
  { key: 'finished', label: 'Завершённые' },
];

const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

function formatStart(startsAt: string | null) {
  if (!startsAt) {
    return 'Дата уточняется';
  }

  const date = new Date(startsAt);
  return Number.isNaN(date.getTime()) ? 'Дата уточняется' : dateTimeFormatter.format(date);
}

function formatStatus(match: Match) {
  switch (match.status) {
    case 'scheduled':
      return 'Предстоящий';
    case 'live':
      return match.minute === undefined ? 'Идёт сейчас' : `Идёт, ${match.minute} мин`;
    case 'finished':
      return 'Завершён';
    case 'postponed':
      return 'Перенесён';
    default:
      return 'Статус уточняется';
  }
}

function MatchCard({
  match,
  favorite,
  onToggleFavorite,
}: {
  match: Match;
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  const score = match.score ? `${match.score.home} : ${match.score.away}` : '—';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.date}>{formatStart(match.startsAt)}</Text>
          <Text style={[styles.status, match.status === 'live' && styles.liveStatus]}>
            {formatStatus(match)}
          </Text>
        </View>
        <FavoriteButton active={favorite} onPress={onToggleFavorite} />
      </View>

      <View style={styles.teamsRow}>
        <Text style={styles.team} numberOfLines={2}>
          {match.home.name}
        </Text>
        <Text style={styles.score}>{score}</Text>
        <Text style={[styles.team, styles.awayTeam]} numberOfLines={2}>
          {match.away.name}
        </Text>
      </View>
    </View>
  );
}

// Экран «Матчи тура» — задание в README.md, часть 1.
export function MatchesScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [round, setRound] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const { isFavorite, toggle } = useFavorites();

  const loadMatches = useCallback(async (signal?: AbortSignal, isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);

    try {
      const response = await fetch(MATCHES_URL, { signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as MatchesResponse;
      if (!data || !Array.isArray(data.matches)) {
        throw new Error('Некорректный формат ответа');
      }

      setMatches(data.matches);
      setRound(data.round);
      setUpdatedAt(new Date());
    } catch (loadError) {
      if (loadError instanceof Error && loadError.name === 'AbortError') {
        return;
      }
      setError('Не удалось загрузить матчи. Проверьте подключение и попробуйте снова.');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadMatches(controller.signal);
    return () => controller.abort();
  }, [loadMatches]);

  const visibleMatches = useMemo(() => {
    if (filter === 'all') {
      return matches;
    }
    return matches.filter((match) => match.status === filter);
  }, [filter, matches]);

  if (loading && matches.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ef3124" />
        <Text style={styles.stateText}>Загружаем матчи…</Text>
      </View>
    );
  }

  if (error && matches.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Что-то пошло не так</Text>
        <Text style={styles.stateText}>{error}</Text>
        <Pressable style={styles.primaryButton} onPress={() => loadMatches()}>
          <Text style={styles.primaryButtonText}>Повторить</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.title}>Матчи тура</Text>
          {round !== null && <Text style={styles.subtitle}>Тур {round}</Text>}
        </View>
        <Pressable
          style={[styles.refreshButton, refreshing && styles.disabledButton]}
          disabled={refreshing}
          onPress={() => loadMatches(undefined, true)}
        >
          <Text style={styles.refreshButtonText}>{refreshing ? 'Обновляем…' : 'Обновить'}</Text>
        </Pressable>
      </View>

      {updatedAt && <UpdatedAgo since={updatedAt} />}
      {error && <Text style={styles.inlineError}>{error}</Text>}

      <View style={styles.filters}>
        {filters.map((item) => {
          const selected = item.key === filter;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[styles.filterButton, selected && styles.selectedFilter]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[styles.filterText, selected && styles.selectedFilterText]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={visibleMatches}
        keyExtractor={(match) => match.id}
        contentContainerStyle={visibleMatches.length === 0 ? styles.emptyList : styles.list}
        renderItem={({ item }) => (
          <MatchCard
            match={item}
            favorite={isFavorite(item.id)}
            onToggleFavorite={() => toggle(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>Матчей нет</Text>
            <Text style={styles.stateText}>Для выбранного фильтра ничего не найдено.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 15,
    color: '#6b7280',
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  refreshButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
  refreshButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  filters: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 12,
    padding: 4,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  filterButton: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 9,
    borderRadius: 7,
  },
  selectedFilter: {
    backgroundColor: '#fff',
  },
  filterText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  selectedFilterText: {
    color: '#111827',
  },
  list: {
    paddingBottom: 24,
  },
  emptyList: {
    flexGrow: 1,
  },
  card: {
    marginBottom: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  date: {
    fontSize: 14,
    color: '#4b5563',
  },
  status: {
    marginTop: 3,
    fontSize: 13,
    color: '#6b7280',
  },
  liveStatus: {
    color: '#ef3124',
    fontWeight: '700',
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  team: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  awayTeam: {
    textAlign: 'right',
  },
  score: {
    minWidth: 64,
    paddingHorizontal: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  stateText: {
    marginTop: 10,
    maxWidth: 420,
    textAlign: 'center',
    lineHeight: 20,
    color: '#6b7280',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  primaryButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#ef3124',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  inlineError: {
    marginTop: 8,
    color: '#b91c1c',
  },
});
