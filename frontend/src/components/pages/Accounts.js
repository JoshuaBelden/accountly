import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Redirect, withRouter } from 'react-router-dom';

import { getAccounts } from '../../actions/accounts';

import Spinner from '../../components/layout/Spinner';
import AccountRow from '../controls/AccountRow';

export const Accounts = ({
    getAccounts,
    authData: { isAuthenticated },
    accountData: { accounts, loading }
}) => {
    useEffect(() => {
        if (loading || !accounts) {
            getAccounts();
        }
    });

    if (!isAuthenticated) {
        return <Redirect to="/" />
    }

    return loading && accounts === null
        ? <Spinner />
        : <Fragment>
            <section className="box">
                <h3 className="large text-primary">Your Accounts</h3>
                <article className="articles">
                    {accounts && accounts.map(account => <AccountRow key={account.id} account={account} />)}
                </article>
                <hr />
                <h4>Add New Account</h4>
                <AccountRow />
            </section>
        </Fragment>;
};

Accounts.propTypes = {
    authData: PropTypes.object.isRequired,
    accountData: PropTypes.object.isRequired,
    getAccounts: PropTypes.func.isRequired
};

const mapStateToProps = state => {
    return {
        authData: state.authData,
        accountData: state.accountData
    };
}

export default connect(mapStateToProps, { getAccounts })(withRouter(Accounts));
