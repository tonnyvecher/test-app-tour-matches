import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

type Props = {
  // Момент последней успешной загрузки данных.
  since: Date;
};

// Подпись «Обновлено N сек назад».
export function UpdatedAgo({ since }: Props) {
  const [seconds, setSeconds] = useState(() =>
    Math.max(0, Math.floor((Date.now() - since.getTime()) / 1000)),
  );

  useEffect(() => {
    const updateSeconds = () => {
      setSeconds(Math.max(0, Math.floor((Date.now() - since.getTime()) / 1000)));
    };

    updateSeconds();
    const intervalId = setInterval(updateSeconds, 1000);
    return () => clearInterval(intervalId);
  }, [since]);

  return <Text style={styles.text}>Обновлено {seconds} сек назад</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 13,
    color: '#6b7280',
  },
});
