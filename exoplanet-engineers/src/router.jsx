import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { useEffect,useState } from 'react';
import Page from './page/index.jsx';
import App from './App.jsx';


function Router() {


    return(
        <Router>
            <Routes>
                <Route path="/" exact component={Page} />
                <Route path="/app" component={App} />
            </Routes>
        </Router>
    )
}