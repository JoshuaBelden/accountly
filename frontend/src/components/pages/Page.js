import { Route, Switch, Link } from 'react-router-dom';
import React, { Fragment } from 'react';

import { Footer } from '../layout/Footer';
import EditProfile from './EditProfile';
import Login from './Login';
import NavBar from '../layout/Navbar';
import Profile from './Profile';
import Register from './Register';
import Settings from './Settings';

export const Page = () => (
    <Fragment>
        <header id="header" className="page">
            <Link to="/">
                <img id="logo" src="/images/logo.png" alt="accountly logo" width="175" />
            </Link>
            <NavBar />
        </header>
        <section className="container">
            <Switch>
                <Route exact path="/register" component={Register} />
                <Route exact path="/login" component={Login} />
                <Route exact path="/profile/:email" component={Profile} />
                <Route exact path="/edit-profile" component={EditProfile} />
                <Route exact path="/settings" component={Settings} />
            </Switch>
            <Footer />
        </section>
    </Fragment>
);
