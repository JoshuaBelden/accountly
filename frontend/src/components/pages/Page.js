import { Routes, Route, Link } from 'react-router-dom';
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
      <Routes>
        <Route exact path="/register" element={<Register />} />
        <Route path="login" element={<Login />} />
        <Route exact path="/profile/:email" element={<Profile />} />
        <Route exact path="/edit-profile" element={<EditProfile />} />
        <Route exact path="/settings" element={<Settings />} />
      </Routes>
      <Footer />
    </section>
  </Fragment>
);
