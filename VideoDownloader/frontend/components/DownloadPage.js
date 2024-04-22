import React, { useState, useEffect} from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';

const DownloadPage = () => {
  const [videoUrl, setVideoUrl] = useState('https://youtube.com/shorts/PS8MXBn3Prg?si=3o1t4D6eMhgRMUNo');
  const [quality, setQuality] = useState('144p');
  const [csrfToken, setCsrfToken] = useState(null);

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('http://192.168.100.141:8000/download/csrf-token/');
        console.log("OK");
        if (!response.ok) {
          throw new Error('Failed to fetch CSRF token');
        }
        const data = await response.json();
        setCsrfToken(data.csrfToken);
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
      }
    };

    fetchCsrfToken();
  }, []);

  const handleDownload = async () => {
    console.log('Download starts...');
    try {
        const headers = {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json',
        };

        const response = await fetch('http://192.168.100.141:8000/download/', {
            method: 'POST',
            headers,
            body: JSON.stringify({ videoUrl, quality }),
        });

        if (!response.ok) {
            throw new Error('Failed to download video');
        }

        const responseData = await response.json();
        Alert.alert('Success', responseData.message); // Alert for success
    } catch (error) {
        console.error('Error:', error);
        Alert.alert('Error', 'An error occurred. Please try again later.'); // Alert for error
    }
};

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter YouTube video URL"
        onChangeText={setVideoUrl}
        value={videoUrl}
      />
      <Button title="Download" onPress={handleDownload} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  input: {
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
  },
});

export default DownloadPage;
