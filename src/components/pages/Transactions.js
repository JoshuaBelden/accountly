import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component, Fragment } from 'react';
import moment from 'moment';

import { importStatement } from '../../actions/datastore';

import Footer from '../layout/Footer';
import Header from '../layout/Header';
import { withRouter } from 'react-router';

const currencyFormatter = new Intl.NumberFormat('en-US', {currency: 'USD', style: 'currency'});

class Transactions extends Component {

    constructor(props) {
        super(props);
        this.state = {
            importFile: null
        };
    }

    onFileChange = event => {
        this.setState({
            importFile: event.target.files[0],
            uploaded: false
        })
    }

    onImportClick = async event => {
        if (!this.state.importFile) {
            return;
        }
        this.props.importStatement(this.props.datastore, await this.state.importFile.text());
        this.forceUpdate();
    }

    render() {
        console.debug('[jcbdbg] Transactions::render this.props.datastore.transactions', this.props.datastore.transactions);
        if (!this.props.datastore.transactions) {
            return <div>No Transactions</div>
        }

        return (
            <Fragment>
                <Header />
                <section className="container">
                    <section className="controls">
                        <section className="import">
                            <input type="file" onChange={this.onFileChange} />
                            <button onClick={this.onImportClick}>
                                Import Statement
                            </button>
                        </section>
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
    importStatement: PropTypes.func.isRequired,
    settings: PropTypes.object.isRequired,
    datastore: PropTypes.object.isRequired
};

const mapStateToProps = state => {
    return {
        settings: state.settings,
        datastore: state.datastore
    };
};

const mapDispatchToProps = dispatch => ({
    importStatement: (datastore, statement) => dispatch(importStatement(datastore, statement))
});

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Transactions));