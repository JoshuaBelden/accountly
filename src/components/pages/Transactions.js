import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component, Fragment } from 'react';
import moment from 'moment';

import Footer from '../layout/Footer';
import Header from '../layout/Header';

const currencyFormatter = new Intl.NumberFormat('en-US', {currency: 'USD', style: 'currency'});

class Transactions extends Component {

    render() {
        if (!this.props.datastore.transactions) {
            return <div>No Transactions</div>
        }

        return (
            <Fragment>
                <Header />
                <section className="container">
                    <section className="overview">

                    </section>
                    <section className="transactions">
                        <table>
                            <thead>
                                <tr>
                                    <td></td>
                                    <td>Date</td>
                                    <td>Description</td>
                                    <td>Category</td>
                                    <td>Amount</td>
                                </tr>
                            </thead>
                            <tbody>
                                {this.props.datastore.transactions.map(t => {
                                    return <Fragment key={t.id}>
                                        <tr>
                                            <td></td>
                                            <td>{moment(t.date).format('MMM DD')}</td>
                                            <td>{t.target ? t.target.name : t.description}</td>
                                            <td>{t.target ? t.target.category : '' }</td>
                                            <td>{currencyFormatter.format(t.amount)}</td>
                                        </tr>
                                    </Fragment>;
                                })}
                            </tbody>
                            <tfoot>
                            </tfoot>
                        </table>
                    </section>
                </section>
                <Footer />
            </Fragment>
        );
    }
}

Transactions.propTypes = {
    settings: PropTypes.object.isRequired,
    datastore: PropTypes.object.isRequired
};

const mapStateToProps = state => {
    return {
        settings: state.settings,
        datastore: state.datastore
    };
};

export default connect(mapStateToProps, null)(Transactions);