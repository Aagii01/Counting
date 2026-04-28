import React, {useState, useEffect, useRef, useContext} from 'react';
import {Image, StyleSheet} from 'react-native';
import {color} from '../../utils/colors';
import * as Native from 'react-native';
import Modal from 'react-native-modal';
import {
  useNavigation,
  useIsFocused,
  DrawerActions,
} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import barcodeImg from '../../assets/barcode.png';
import inputbarcodeimg from '../../assets/inputbarcode.png';
import Toast from 'react-native-toast-message';
import {WIDGET_TYPE} from '../../utils/enums';
import tw from 'twrnc';
import {GetDateTime, ActionPush} from '../../utils/functions';
import Calculator from '../Calculator';
import CalcIndicator from '../../component/CalcIndicator';
import ColorList from '../../component/ColorList';
import InputBarcode from '../../component/InputBarcode';
import ProductList from '../../component/ProductList';
import {GlobalContext} from '../../context';
import Loading from '../../component/Loading';
import {
  PRODUCT_TABLE,
  ADD_PRODUCT_BARCODE,
  ADD_PRODUCT,
  GET_COUNTING_PRODUCTS_QUERY,
  ADD_COUNTING_PRODUCT_QUERY,
} from '../../utils/names';
import * as Animatable from 'react-native-animatable';
import {groupCountingProducts} from '../../utils/functions';
import BarcodeScanner from '../../component/BarcodeScanner';
import {GetDateTimes} from '../../utils/functions';

const MainCounting = props => {
  const context = useContext(GlobalContext);
  const [isVisible, setIsVisible] = useState(false);
  const [isCamera, setIsCamera] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [productId, setProductId] = useState();
  const [barcode, setBarcode] = useState();
  const [code, setCode] = useState('');
  const [data, setData] = useState([]);
  const isFocused = useIsFocused();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isFocused) {
      getData();
    }
  }, [isFocused]);

  const getData = () => {
    context
      ?.request({
        url: `/api/count/getcountingproducts/${props?.route?.params.countingId}`,
        method: 'GET',
      })
      // context
      //   ?.asyncQuery({
      //     query: GET_COUNTING_PRODUCTS_QUERY,
      //     params: [props?.route?.params?.countingId],
      //   })
      .then(res => {
        let result = groupCountingProducts(res.data);
        setLoaded(true);
        setData(result);
      });
  };

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const OpenCountModal = id => {
    if (id !== undefined && id !== null) setProductId(id);
    props.navigation.navigate('CountModal', {
      saveCount: (count, id) => {
        saveCount(count, null, id);
      },
      id: id,
    });
  };

  const onChangeCode = value => {
    setCode(value);
  };

  const closeModal = () => {
    setIsVisible(false);
  };

  const openModal = () => {
    setIsVisible(true);
  };

  const onChangeWin = () => {
    setIsCamera(prevIsCamera => !prevIsCamera);
  };

  const CheckBarcode = async (code, clearBarcode, focusInput) => {
    var newCode = [code.toString()];
    // context
    //   ?.asyncQuery({
    //     query: `SELECT * FROM ${PRODUCT_TABLE} WHERE barcode = ?`,
    //     params: newCode,
    //   })
    const storeid = await AsyncStorage.getItem('@storeid');
    context
      ?.request({
        url: `/api/count/checkbarcode/${newCode}/${JSON.parse(storeid)}`,
        method: 'GET',
      })
      .then(res => {
        if (res.data === null) {
          if (JSON.parse(storeid)) {
            props.navigation.navigate('ProductNotFound', {
              close: () => {
                AddProduct(newCode);
              },
            });
          } else {
            AddProduct(newCode);
          }
        } else {
          setProductId(res.data.id);
          setBarcode(code);
          props.navigation.navigate('CountModal', {
            ...props.route.params,
            saveCount: (count, productId) => {
              saveCount(count, null, productId);
            },
            clearBarcode: clearBarcode,
            id: res.data.id,
          });
        }
      });
  };

  const saveCount = async (count, focusInput, productId) => {
    // setProductId(productId);
    let colorid = await AsyncStorage.getItem('@ACTIVE_COLOR');
    const storeid = await AsyncStorage.getItem('@storeid');
    let params = {
      date: GetDateTime(),
      countingid: Number(props.route.params.countingId),
      productid: productId,
      count: Number(count),
      colorid: Number(colorid),
      storeid: JSON.parse(storeid),
      barcode: code.toString(),
    };

    context
      ?.request({
        url: `/api/count/addcountingdet`,
        method: 'POST',
        body: params,
      })
      .then(res => {
        if (res.success) {
          getData();
          onChangeCode('');
          if (!isCamera && focusInput) focusInput();
        }
      });
  };

  const AddProduct = async code => {
    const storeid = await AsyncStorage.getItem('@storeid');
    let params = {
      barcode: String(code),
      storeid: JSON.parse(storeid),
      edit: false,
    };
    context
      ?.request({
        url: `/api/count/addbarcode`,
        method: 'POST',
        body: params,
      })
      .then(res => {
        if (res.success) {
          setProductId(res.data.id);
          setBarcode(res?.data?.barcode);
          props.navigation.navigate('CountModal', {
            ...props.route.params,
            saveCount: (count, productId) => {
              saveCount(count, focusInput, productId);
            },
            id: res.data.id,
          });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Бараа бүртгэж чадсангүй.',
            topOffset: 10,
            visibilityTime: 3000,
          });
        }
      });
  };

  const onReadedBarcode = (code, clearBarcode, focusInput) => {
    CheckBarcode(code, clearBarcode, focusInput);
  };

  const navigation = useNavigation();
  return (
    <>
      <Native.SafeAreaView />
      <Native.View
        style={{
          ...styles.containers,
          borderBottomColor: '#f3f3f3',
        }}>
        <Native.View style={tw`flex-row items-center justify-between`}>
          <Native.TouchableOpacity
            style={{flex: 0.2}}
            onPress={() => {
              props.route.params.type === 'goBack'
                ? navigation.goBack()
                : navigation.navigate('BottomTabs');
            }}
            hitSlop={{top: 50, bottom: 50, left: 50, right: 100}}>
            <Image
              source={require('../../assets/ArrowBack.png')}
              style={{
                width: 24,
                height: 24,
                resizeMode: 'contain',
                tintColor: 'white',
              }}
            />
          </Native.TouchableOpacity>
          <Native.View style={{flex: 1, alignItems: 'center'}}>
            <Native.Text style={styles.headerText}>
              {`${props.route.params.countingName} -  ${GetDateTimes(
                props.route.params.date,
              )}`}
            </Native.Text>
          </Native.View>
          <Native.TouchableOpacity
            style={{flex: 0.2, alignItems: 'flex-end'}}
            onPress={onChangeWin}>
            <Native.Image
              source={isCamera ? inputbarcodeimg : barcodeImg}
              style={{height: 30, width: 40, resizeMode: 'contain'}}
            />
          </Native.TouchableOpacity>
        </Native.View>
      </Native.View>
      {loaded ? (
        // <Native.View
        //   style={{
        //     height:
        //       Native.Platform.OS === 'ios'
        //         ? ''
        //         : Native.Dimensions.get('window').height,
        //   }}>
        <Native.View style={styles.container}>
          {isCamera ? (
            <Animatable.View animation="zoomIn">
              <BarcodeScanner
                onChangeCode={onChangeCode} //
                onReadedBarcode={onReadedBarcode} //
                focusInput={focusInput}
                activeCamera={true}
              />
            </Animatable.View>
          ) : (
            <InputBarcode
              saveBarcode={onReadedBarcode}
              onChangeCode={onChangeCode}
              code={code}
            />
          )}

          <ProductList
            ismaster={props.route.params.ismaster}
            type={WIDGET_TYPE.COUNTING}
            data={data}
            OpenCountModal={OpenCountModal}
            style={{paddingHorizontal: 10, zIndex: -1}}
            navigation={navigation}
          />
          <CalcIndicator openModal={openModal} />
          <Modal
            isVisible={isVisible}
            onSwipeComplete={closeModal}
            onBackdropPress={closeModal}
            onBackButtonPress={closeModal}
            style={{justifyContent: 'flex-end', margin: 0}}
            swipeDirection={'down'}>
            <Calculator isModal />
          </Modal>
          <Native.View
            style={{
              height:
                Native.Platform.OS === 'ios'
                  ? ''
                  : Native.Dimensions.get('window').height / 6,
            }}>
            <ColorList data={props.color} />
          </Native.View>
        </Native.View>
      ) : (
        <Loading />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E5E5',
  },
  headerText: {
    color: '#FFF',
    width: '100%',
    textAlign: 'center',
  },
  containers: {
    backgroundColor: color.maincolor,
    /* height: 50, */
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // borderBottomWidth: 1,
    borderColor: 'black',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  title: {
    fontSize: 18,
    color: 'white',
    marginLeft: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
    marginTop: 20,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default MainCounting;
