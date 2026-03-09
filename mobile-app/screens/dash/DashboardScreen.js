import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { AuthContext } from '../../../contexts/AuthContext';
import { apiService } from '../../../services/apiService';

const DashboardScreen = () => {
  const { user, signOut } = useContext(AuthContext);
  const [symptomText, setSymptomText] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!symptomText.trim()) {
      Alert.alert('Error', 'Please describe your symptoms');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.analyzeSymptoms(symptomText);
      setAnalysisResult(response.data);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../../assets/images/icon-192.png')}
            style={styles.headerLogo}
          />
          <View>
            <Text style={styles.appName}>PULSE</Text>
            <Text style={styles.appSub}>AI Health Assistant</Text>
          </View>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>👤 Welcome</Text>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userRole}>{user?.role === 'patient' ? '🏥 Patient' : '👨‍⚕️ Doctor'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🩺 Symptom Analysis</Text>
        <Text style={styles.cardSubtitle}>Describe your symptoms</Text>

        <TextInput
          style={styles.textArea}
          placeholder="e.g., I have a headache and sore throat..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          value={symptomText}
          onChangeText={setSymptomText}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.analyzeButton, loading && styles.buttonDisabled]}
          onPress={handleAnalyze}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>🔍 Analyze</Text>
          )}
        </TouchableOpacity>
      </View>

      {analysisResult && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>📋 Analysis Result</Text>

          {analysisResult.detectedSymptoms?.length > 0 && (
            <View style={styles.resultSection}>
              <Text style={styles.sectionTitle}>Symptoms Detected:</Text>
              <Text style={styles.sectionContent}>
                {analysisResult.detectedSymptoms.join(', ')}
              </Text>
            </View>
          )}

          {analysisResult.urgency && (
            <View
              style={[
                styles.resultSection,
                analysisResult.urgency === 'URGENT' && styles.urgentBg,
              ]}
            >
              <Text style={styles.sectionTitle}>⚠️ Urgency Level:</Text>
              <Text style={styles.sectionContent}>{analysisResult.urgency}</Text>
            </View>
          )}

          {analysisResult.severity && (
            <View style={styles.resultSection}>
              <Text style={styles.sectionTitle}>📊 Severity:</Text>
              <Text style={styles.sectionContent}>{analysisResult.severity}</Text>
            </View>
          )}

          {analysisResult.conditions?.length > 0 && (
            <View style={styles.resultSection}>
              <Text style={styles.sectionTitle}>🏥 Possible Conditions:</Text>
              {analysisResult.conditions.map((cond, idx) => (
                <Text key={idx} style={styles.bulletPoint}>
                  • {cond}
                </Text>
              ))}
            </View>
          )}

          {analysisResult.analysis && (
            <View style={styles.resultSection}>
              <Text style={styles.sectionTitle}>📝 Detailed Analysis:</Text>
              <Text style={styles.sectionContent}>{analysisResult.analysis}</Text>
            </View>
          )}

          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              ⚖️ Medical Disclaimer: This analysis is for informational purposes only.
              Always consult with a healthcare professional for proper diagnosis and treatment.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2b67ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  appName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  appSub: {
    color: '#e0e0ff',
    fontSize: 12,
  },
  logoutBtn: {
    backgroundColor: '#d32f2f',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2b67ff',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#666',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    backgroundColor: '#f9f9f9',
  },
  analyzeButton: {
    backgroundColor: '#2b67ff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  resultSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  urgentBg: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    borderBottomWidth: 0,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2b67ff',
    marginBottom: 6,
  },
  sectionContent: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  bulletPoint: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
    marginLeft: 8,
  },
  disclaimerBox: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 18,
  },
});

export default DashboardScreen;
