import React, { useEffect, useState } from 'react';
import { Text, View, Button, StyleSheet } from 'react-native';

export default function App() {
  const [msg, setMsg] = useState('');

  useEffect(() => {
    // Try to fetch backend welcome route. Configure API_URL in environment if needed.
    const API = typeof process !== 'undefined' && process.env.API_URL ? process.env.API_URL : 'http://localhost:5000';
    fetch(`${API}/`)
      .then(r => r.text())
      .then(t => setMsg(t))
      .catch(() => setMsg('Unable to reach backend'));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mobile App (Expo)</Text>
      <Text style={styles.msg}>{msg}</Text>
      <Button title="Refresh" onPress={() => { setMsg('Refreshing...'); setTimeout(()=>setMsg('Refreshed'),500); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 20, marginBottom: 12 },
  msg: { marginBottom: 12 }
});
