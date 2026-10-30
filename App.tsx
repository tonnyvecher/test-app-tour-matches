import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { MatchesScreen } from './src/screens/MatchesScreen';

export default function App() {
  return (
    <View style={styles.root}>
      <MatchesScreen />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 48,
    backgroundColor: '#fff',
  },
});
