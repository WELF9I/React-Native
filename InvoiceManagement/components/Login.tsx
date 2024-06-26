import React, { useState,useEffect } from 'react'
import { Image, StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TouchID from 'react-native-touch-id';
import Database from '../Database';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const Login = () => {
  const db = Database();
  const [auth,setAuth]=useState(false);
  const [isChecked, setIsChecked] = useState<boolean>(false);

  useEffect(() => {displayWelcomeTable();},[])

    const optionalConfigObject = {
        title: 'Authentication Required', // Android
        imageColor: '#e00606', // Android
        imageErrorColor: '#ff0000', // Android
        sensorDescription: 'Touch sensor', // Android
        sensorErrorDescription: 'Failed', // Android
        cancelText: 'Cancel', // Android
        fallbackLabel: 'Show Passcode', // iOS (if empty, then label is hidden)
        unifiedErrors: false, // use unified error messages (default false)
        passcodeFallback: false, // iOS - allows the device to fall back to using the passcode, if faceid/touch is not available. this does not mean that if touchid/faceid fails the first few times it will revert to passcode, rather that if the former are not enrolled, then it will use the passcode.
    };

    const displayWelcomeTable = async () => {
      try {
        await db.transaction(async (txn) => {
          const selectQuery = 'SELECT deviceLock FROM welcome where id=?;';
          txn.executeSql(selectQuery, [1], (tx, res) => {
            const rows = res.rows;
            const data = rows.item(0);
          if (data) {setIsChecked(data.deviceLock === 'true');}
          });
        });
      } catch (error) {
        console.error('Error displaying welcome table: ', error);
      }
    };

  const handleLogin=() => {
    isChecked == true ? handleBio() : navigation.navigate('Expenses');

  };
  const handleBio=()=>{
    TouchID.isSupported(optionalConfigObject)
    .then(biometryType => {
    // Success code
    if (biometryType === 'FaceID') {
        console.log('FaceID is supported.');
    } else {
        if(auth){
            return null;
        }
        TouchID.authenticate('',optionalConfigObject)
        .then((success: boolean | ((prevState: boolean) => boolean))=>{
            setAuth(success);
            navigation.navigate('Expenses');
            
        })
        .catch((err: any)=>{
            console.log('Failed',err);
        })
    }
   })
}
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.background}>
      <SafeAreaView style={styles.container}>
        <View><Text style={styles.text}>Use your fingerprint to Login</Text></View>
        <View><Image source={require('../assets/fingerprint.png')} style={styles.image} /></View>
        <View><Text style={styles.text}>You can use the fingerprint sensor to login</Text></View>
        <View>
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    padding: 20,
    width: '90%',
    height: '90%',
    marginLeft: '5%',
    marginTop: '5%',
    alignContent: 'center',
  },
  background: {
    height: hp('100%'),
    backgroundColor: '#BD1839',
  },
  text: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  image: {
    width: 150,
    height: 150,
    margin: '15%',
  },
  button: {
    width: 170,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    marginTop: '15%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 20,
    color: '#000',
    paddingTop: 13,
    fontFamily: 'Verdana',
  },
});

export default Login;


