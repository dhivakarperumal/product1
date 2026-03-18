import React from 'react'
import Login from './Components/Login'
import { Outlet } from 'react-router-dom';
import Navbar from './Components/Navbar';
import Footer from './Components/Footer';

const App = () => {
  return (
     <div>
       <Navbar />
       <Outlet/>
       <Footer/>
    </div>
  )
}

export default App