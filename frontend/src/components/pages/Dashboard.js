import React, { Fragment } from 'react';

import Navbar from '../layout/Navbar';
import { Footer } from '../layout/Footer';

export const Dashboard = () => {
    return (
        <Fragment>
            <div className="page-wrapper">
                <header id="header" className="alt">
                    <Navbar />
                </header>
                <section id="banner">
                    {/* <img id="logo" src="images/logo.png" alt="Accountly logo" /> */}
                    <h1>Accountly</h1>
                    <p>Personal finance for kick ass budgets.</p>
                </section>

                <section id="main" className="container">
                    <section className="box special">
                        <header className="major">
                            <h2>Spending Insights</h2>
                            <div>
                                <p>
                                    
							    </p>
                            </div>
                        </header>
                    </section>
                    <section className="box special features">
                        <div className="features-row feature-card-container">
                            <div className="feature-card">
                                <div className="feature-card-header">
                                    <i className="fa fa-beer" />
                                    Chart
                                </div>
                                <div className="feature-card-content">
                                    <p>
                                        
                                    </p>
                                </div>
                            </div>
                            <div className="feature-card">
                                <div className="feature-card-header">
                                    <i className="fa fa-route" />
                                    Chart
                                </div>
                                <div className="feature-card-content">
                                    <p>
                                        
                                    </p>
                                </div>
                            </div>
                            <div className="feature-card">
                                <div className="feature-card-header">
                                    <i className="fa fa-hand-holding-heart" />
                                    Chart
                                </div>
                                <div className="feature-card-content">
                                    <p>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </section>
                <Footer />
            </div>

        </Fragment>
    );
};
