import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, ScrollView, Text, Modal, TouchableOpacity, TextInput, Button, Platform, ToastAndroid } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { convert } from 'react-native-pdf-to-image';
import { SelectList } from 'react-native-dropdown-select-list';
import DocumentPicker from 'react-native-document-picker';
import { formatCurrency} from "react-native-format-currency";
import Database from '../Database';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';

import Statistics from './Statistics';

interface DataItem {
  idInc:any;
  idCurr:any;
  category:any;
  amount: string;
  dateIncome: string;
  pdfFile: string;
}
interface DataItemExtreme {
  idInc:any;
  idCurr:any;
  category:any;
  amount: string;
  dateIncome: string;
  pdfFile: string;
  categoryName: string;
  categoryImage: string;
  mainCurrency: string;
  otherCurrencies: string;
}
interface DataItemCategory {
  idCat : any; 
  categoryName: string;
  categoryImage: string;
}
interface DataItemCategory2 {
  key : string; 
  value: string;
  cselected?: boolean;
}

interface DataItemCurrency {
  id : any; 
  mainCurrency: string;
  otherCurrencies: string;
}
const IncomesList: React.FC<{incomesData: DataItemExtreme[];CategoryData: DataItemCategory2[];showButtons: boolean;selectedCurrency:any }> = ({incomesData,CategoryData,showButtons,selectedCurrency}) => {
  const [CategoriesData2, setCategoriesData2] = useState<DataItemCategory2[]>([]);
  const [IncomesData, setIncomesData] = useState<DataItemExtreme[]>([]);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [editedIncome, setEditedIncome] = useState<DataItemExtreme | null>(null);
  const [editedAmount, setEditedAmount] = useState<string>('');
  const [pdfModalVisible, setPdfModalVisible] = useState<boolean>(false);
  const [pdfImages, setPdfImages] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editedPdf, setEditedPdf] = useState<string>('');
  const [selectedIdCategory,setSelectedIdCategory]=useState<any>();
  const [selectedIdCurrency,setSelectedIdCurrency]=useState<any>();

  let MyPath:any[]=[]
  const db = Database();

  useEffect(() => {
    setCategoriesData2(CategoryData);
  }, [CategoryData]);

  useEffect(() => {
    setSelectedIdCurrency(selectedCurrency);
  }, [selectedCurrency]);

  useEffect(() => {
    setIncomesData(incomesData);
  }, [incomesData]);


  const showToastWithGravity = (text: string) => {
    ToastAndroid.showWithGravity(
      text,
      ToastAndroid.SHORT,
      ToastAndroid.CENTER
    );
  };

  const Delete = async (id: number) => {
    try {
      await db.transaction(async (txn) => {
        const deleteQuery = `DELETE FROM incomes WHERE idInc = ?;`;
        await txn.executeSql(deleteQuery, [id], (tx, res) => {
          console.log('Income deleted successfully !');
        });
      });
    } catch (error) {
      console.error('Error deleting income: ', error);
    }
  };

  const handleDeleteIncome = (id:number,index: number) => {
    const newIncomes = [...IncomesData];
    newIncomes.splice(index, 1);
    setIncomesData(newIncomes);
    //console.log('index = ', index);
    Delete(id);
    showToastWithGravity('Income deleted successfully!');
  };

  const updateIncomeInDatabase = async (idInc: any,idCat:any,idCurr:any,amount:string,dateIncome:string,pdfFile:string) => {
    try {
      await db.transaction(async (txn) => {
        const updateQuery = `
          UPDATE incomes
          SET amount = ?, dateIncome = ?, pdfFile = ?, category = ?, idCurr = ?
          WHERE idInc = ?;
        `;
        await txn.executeSql(updateQuery, [amount, dateIncome, pdfFile,idCat,idCurr,idInc], (tx, res) => {
          console.log('Income updated successfully in the database');
          //displayIncomesTable();
        });
      });
    } catch (error) {
      console.error('Error updating income: ', error);
    }
  };

  const handleSaveEditIncome = async () => {
    if (editedIncome) {
      try {
        await db.transaction(async (txn) => {
          const updateQuery = `
            UPDATE incomes
            SET amount = ?, dateIncome = ?, pdfFile = ?, category = ?, idCurr = ?
            WHERE idInc = ?;
          `;
          await txn.executeSql(
            updateQuery,
            [
              editedAmount || editedIncome.amount,
              concatenateDateTime(selectedDate, selectedTime) || editedIncome.dateIncome,
              editedPdf || editedIncome.pdfFile,
              selectedIdCategory || editedIncome.category,
              selectedIdCurrency || editedIncome.idCurr,
              editedIncome.idInc,
            ],
            (tx, res) => {
              console.log('Income updated successfully in the database');
            }
          );
        });
        const updatedIncomes = IncomesData.map((income) => {
          if (income.idInc === editedIncome.idInc) {
            const updatedIncome = {
              ...income,
              amount: editedAmount || income.amount,
              dateIncome: concatenateDateTime(selectedDate, selectedTime) || income.dateIncome,
              category: selectedIdCategory || income.category,
              pdfFile: editedPdf || income.pdfFile,
              idCurr: selectedIdCurrency || income.idCurr,
            };
        
            //console.log("Updated Income:", updatedIncome);
            return updatedIncome;
          } else {
            return income;
          }
        });
  
        showToastWithGravity('Income updated successfully!');
        setIncomesData(updatedIncomes);
        setEditModalVisible(false);
        setEditedIncome(null);
        setEditedAmount('');
        setEditedPdf('');
        setSelectedIdCurrency(null);
      } catch (error) {
        console.error('Error updating income: ', error);
      }
    }
  };
  
  const fetchPdfImages = async (path:string) => {
    try {
      const fixedPdfUri = path;
      const images = await convert(fixedPdfUri);
      if (images.outputFiles) {
        setPdfImages(images.outputFiles);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const EditPDF = async () => {
    try {
      const docs = await DocumentPicker.pick({
        type: DocumentPicker.types.pdf,
        copyTo: 'cachesDirectory',
      });
      if (docs?.length) {
        const uri = docs[0]?.fileCopyUri || '';
        MyPath.push(uri);
        let ind=MyPath.indexOf(uri);
        showToastWithGravity('PDF picked succesfully');
        setEditedPdf(MyPath.join(";"));
      }
    } catch (e) {
      console.log(e);
    }
    return MyPath.join(";");

  };
  
  const handleEditIncome = (index: number) => {
    setEditedIncome(IncomesData[index]);
    setEditedAmount(IncomesData[index].amount);
    setEditedPdf(IncomesData[index].pdfFile);
    setEditModalVisible(true);
  };

  const handleViewPdf = (path:string) => {
    setPdfModalVisible(true);
    fetchPdfImages(path);
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setEditedIncome(null);
    setEditedAmount('');
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const concatenateDateTime = (selectedDate: Date, selectedTime: Date): string => {
    const formattedDate = formatDate(selectedDate);
    const formattedTime = formatTime(selectedTime).replace(/\s?[APMapm]+$/g, '');

    return `${formattedDate} ${formattedTime}`;
  };

  const showDatePickerVisible = () => {
    setIsDatePickerVisible(true);
  };

  const handleDateChange = (event: any, newDate: any) => {
    setIsDatePickerVisible(Platform.OS === 'ios');
    if (newDate) {
      setSelectedDate(newDate);
    }
  };

  const showTimePickerHandler = () => {
    setShowTimePicker(true);
  };

  const handleTimeChange = (event: any, selectedDate: any) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedTime(selectedDate);
    }
  };

  return (
      IncomesData.map((income: any, index: any) => (
        <View key={index} style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderText}>{income.categoryName}</Text>
            {showButtons && (

                <TouchableOpacity onPress={() => handleViewPdf(income.pdfFile)}>
                  <Image source={require('../assets/viewIcon.png')} style={styles.icons} />
                </TouchableOpacity>
            )}
            <Image source={{ uri: income.categoryImage }} style={styles.SoftHardicons} />
          </View>
  
          <View style={styles.cardContent}>
            <View style={styles.cardContentColumn}>
              <Text style={styles.cardContentText}>Amount: {formatCurrency({ amount: Number(income.amount), code: income.mainCurrency }).splice(0, 1)}</Text>
              <Text style={styles.cardContentText}>DateTime: {income.dateIncome}</Text>
              <Text style={styles.cardContentText}>Currency: {income.mainCurrency}</Text>
            </View>
  
            {showButtons && (
              <View style={styles.cardContentRow}>
                <TouchableOpacity onPress={() => handleEditIncome(index)}>
                  <Image source={require('../assets/edit.png')} style={styles.icons} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteIncome(income.idInc, index)} style={{ marginLeft: '2%' }}>
                  <Image source={require('../assets/delete.png')} style={styles.iconDelete} />
                </TouchableOpacity>
              </View>
            )}
          </View>
  
          {/* PDF Display */}
          <Modal visible={pdfModalVisible} transparent animationType="slide">
            
            <View style={styles.modalContainer}>
              {pdfImages.map((imgPath, imgIndex) => (
                <View key={imgIndex} style={styles.imgContainer}>
                  <Image style={styles.image} source={{ uri: `file://${imgPath}` }} />
                </View>
              ))}
              <TouchableOpacity style={styles.closeButton} onPress={() => setPdfModalVisible(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Modal>
  
          <Modal visible={editModalVisible} transparent animationType="slide">
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={{ color: 'black', fontWeight: 'bold', marginBottom: '20%', fontSize: 20, textAlign: 'center' }}>Edit income</Text>
                <TextInput
                  placeholder="Amount"
                  value={editedAmount}
                  onChangeText={(text: any) => setEditedAmount(text)}
                  keyboardType="numeric"
                  style={{
                    color:'white',
                    paddingLeft: 15,
                    backgroundColor: '#2196F5',
                    borderRadius: 2,
                    marginBottom: '7%',
                    elevation: 5,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 3,
                    height:44,
                  }}
                />
  
                <View style={{ marginBottom: 20 }}>
                  <Button title={formatDate(selectedDate)} onPress={showDatePickerVisible} />
                  {isDatePickerVisible && (
                    <DateTimePicker value={selectedDate} mode="date" display="default" onChange={handleDateChange} />
                  )}
                </View>
  
                <View style={{ marginBottom: 20 }}>
                  <Button title={formatTime(selectedTime)} onPress={() => showTimePickerHandler()} />
                  {showTimePicker && (
                    <DateTimePicker
                      value={selectedTime}
                      mode="time"
                      is24Hour={true}
                      display="default"
                      onChange={handleTimeChange}
                    />
                  )}
                </View>
  
                <SelectList
                  data={CategoryData}
                  save="key"
                  placeholder='Category'
                  setSelected={(key: any) => setSelectedIdCategory(key)}
                  boxStyles={{
                    borderRadius: 2,
                    borderColor: '#2196F5',
                    borderStyle: 'solid',
                    backgroundColor: '#2196F5',
                    shadowColor: '#000',
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                    height: 44,
                  }}
                  inputStyles={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}
                  dropdownTextStyles={{ color: 'black', fontWeight: 'bold' }}
                  badgeTextStyles={{ color: 'white', fontSize: 14 }}
                  badgeStyles={{ backgroundColor: '#2196F5' }}
                  labelStyles={{ color: 'white', fontWeight: 'bold', fontSize: 15, marginLeft: 2, borderRadius: 5 }}
                  dropdownItemStyles={{
                    backgroundColor: '#2196F5',
                    marginHorizontal: 6
                  }}
                  dropdownStyles={{
                    backgroundColor: '#2196F5',
                    borderRadius: 8,
                    borderColor: '#2196F5',
                    shadowColor: '#000',
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 5
                  }}
                />
  
                <TouchableOpacity style={styles.button} onPress={EditPDF}>
                  <Text style={styles.buttonText} >Pick PDF</Text>
                </TouchableOpacity>
  
                <View style={{ flexDirection: 'row', width: '100%', height: '20%', alignItems: 'center', justifyContent: 'space-around' }}>
                  <TouchableOpacity onPress={handleSaveEditIncome} style={styles.SaveCancel}>
                    <Text style={styles.SaveCancelText} >Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleCancelEdit} style={styles.SaveCancel}>
                    <Text style={styles.SaveCancelText} >Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
          </Modal>
        </View>
        
      ))
  );  
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor:'white',
    width: '90%',
    height: 180,
    marginLeft: '5%',
    marginTop: '2.5%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2, 
    },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 3,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  
  cardHeader: {
    backgroundColor: '#D9D9D9',
    width: '100%',
    height: '28%',
    justifyContent: 'space-between',
    flexDirection: 'row',
    padding: '2.5%',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  cardHeaderText: {
    color: 'black',
    fontSize: 17,
    fontWeight: 'bold',
  },
  icons: {
    width: 33,
    height: 33,
  },
  SoftHardicons: {
    width: 38,
    height: 38,
    borderRadius:40,
  },
  viewIcon: {
    width: 25,
    height: 25,
  },
  cardContent: {
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  cardContentColumn: {
    marginRight: '2%',
    marginTop: '5%',
  },
  cardContentRow:{
    flexDirection: 'row',
    marginTop:'13%',
  },
  cardContentText: {
    color: 'black',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: '5%',
    marginLeft: '3%',
  },
  iconDelete: {
    width: 35,
    height: 33,
    marginLeft: '10%',
  },
  modalContainer: {
    flex: 1,
    alignContent:'center',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    width:'80%',
    padding: 20,
    borderRadius: 10,
  },
  button: {
    borderRadius:2,
    width: '100%',
    height: 44,
    marginTop: '7%',
    backgroundColor: '#2196F5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  SaveCancel: {
    alignContent:'center',
    alignItems:'center',
    width: '40%',
    height: 44,
    backgroundColor: '#2196F5',
    borderRadius: 7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    }, 
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  SaveCancelText: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#FFFFFF', 
    textAlign: 'center',
    paddingTop:8,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#FFFFFF', 
    paddingTop: 10,
    fontFamily: 'Verdana',
    textAlign: 'center',
  },
 
  imgContainer: {
    flex: 1,
    padding: 5,
  },
  image: {
    marginTop: 100,
    width: 350,
    height: 600,
  },
  closeButton: {
    backgroundColor: '#BD1839',
    padding: 10,
    borderRadius: 5,
    marginBottom:30,
    width:120,
  },
  closeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize:18,
  },
});

export default IncomesList