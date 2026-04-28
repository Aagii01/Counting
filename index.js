/**
 * @format
 */
import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './MainContainer';
import {name as appName} from './app.json';
import CodePush from 'react-native-code-push';
const codePushOptions = {checkFrequency: CodePush.CheckFrequency.MANUAL};
AppRegistry.registerComponent(appName, () => CodePush(codePushOptions)(App));
