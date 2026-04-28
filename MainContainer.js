import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {GlobalProvider} from './src/context';
import App from './src';
import {NativeBaseProvider} from 'native-base';

const MainContainer = () => {
  return (
    <NavigationContainer>
      <GlobalProvider>
        <NativeBaseProvider>
          <App />
        </NativeBaseProvider>
      </GlobalProvider>
    </NavigationContainer>
  );
};

export default MainContainer;
