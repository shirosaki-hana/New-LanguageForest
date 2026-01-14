import { BrowserRouter, Route, Navigate } from 'react-router-dom';
import GlobalDialog from './components/common/GlobalDialog';
import GlobalSnackbar from './components/common/GlobalSnackbar';
import Layout from './components/Layout';
import WelcomePage from './pages/WelcomePage';

function MainRouter() {
  return (
  <>
    <Route element={<Layout />}>
      <Route path='/' element={<WelcomePage />} />
    </Route>
    <Route path='*' element={<Navigate to='/' replace />} />
  </>);
}

function App() {
  return (
    <BrowserRouter>
      <MainRouter />
      <GlobalDialog />
      <GlobalSnackbar />
    </BrowserRouter>
  );
}

export default App;
