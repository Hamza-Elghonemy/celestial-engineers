import React from 'react';
import { BrowserRouter as Router, Route,Routes } from 'react-router-dom';
import { useEffect,useState } from 'react';
import Page from './page/index.jsx';
import App from './App.jsx';
import './index.css';


export default function Routing() {


    return(
        <Router>
            <Routes>
                <Route path="/" element={<Page/>} />
                <Route path="/app" element={<App/>} />
            </Routes>
        </Router>
    )
}