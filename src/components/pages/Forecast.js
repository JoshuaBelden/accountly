import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Fragment } from 'react';

import { Footer } from '../layout/Footer';
import { Header } from '../layout/Header';

const Forecast = ({ settings, datastore }) => {
    console.log('jcbdbg::settings', settings);
    console.log('jcbdbg::datastore', datastore);
    return (
        <Fragment>
            <Header />
            <section className="container">
                
            </section>
            <Footer />
        </Fragment>
    );
}

Forecast.propTypes = {
    settings: PropTypes.object.isRequired,
    datastore: PropTypes.object.isRequired
};

const mapStateToProps = state => {
    return {
        settings: state.settings,
        datastore: state.datastore
    };
}

export default connect(mapStateToProps, null)(Forecast);