import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const DevicesScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>⌚ Connected Devices</Text>
      <View style={styles.card}>
        <Text style={styles.emptyText}>No devices connected</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});

export default DevicesScreen;
