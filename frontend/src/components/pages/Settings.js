import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Redirect, withRouter } from 'react-router-dom';

import { getAccounts } from '../../actions/accounts';
import { getAssets } from '../../actions/assets';
import { getExpenditures } from '../../actions/expenditures';
import { getIncome } from '../../actions/income';
import { getLiabilities } from '../../actions/liabilities';

import Spinner from '../layout/Spinner';
import AccountEdit from '../controls/AccountEdit';
import AssetEdit from '../controls/AssetEdit';
import ExpenditureEdit from '../controls/ExpenditureEdit';
import IncomeEdit from '../controls/IncomeEdit';
import LiabilityEdit from '../controls/LiabilityEdit';

const Settings = ({
    getAccounts,
    getAssets,
    getExpenditures,
    getIncome,
    getLiabilities,
    authData: { isAuthenticated },
    accountData: { accounts },
    assetData: { assets },
    expenditureData: { expenditures = {} },
    incomeData: { income },
    liabilityData: { liabilities }
}) => {
    useEffect(() => {
        if (!accounts) {
            getAccounts();
        }

        if (!assets) {
            getAssets();
        }

        if (!expenditures) {
            getExpenditures();
        }

        if (!income) {
            getIncome();
        }

        if (!liabilities) {
            getLiabilities();
        }
    });

    if (!isAuthenticated) {
        return <Redirect to="/" />
    }

    return accounts === null || assets === null || expenditures === null || income === null || liabilities === null
        ? <Spinner />
        : <Fragment>
            <section className="box">
                <h2 className="large text-primary">Accounts</h2>
                <article className="articles">
                    {accounts && accounts.map(account => <AccountEdit key={account.id} account={account} />)}
                </article>
                <hr />
                <AccountEdit />

                <h2 className="large text-primary">Income</h2>
                <article className="articles">
                    {income && income.map(i => <IncomeEdit key={i.id} income={i} />)}
                </article>
                <hr />
                <IncomeEdit />

                <h2 className="large text-primary">Liabilities</h2>
                <article className="articles">
                    {liabilities && liabilities.map(liability => <LiabilityEdit key={liability.id} liability={liability} />)}
                </article>
                <hr />
                <LiabilityEdit />

                <h2 className="large text-primary">Expenditures</h2>
                <article className="articles">
                    {expenditures && expenditures.map(expenditure => <ExpenditureEdit key={expenditure.id} expenditure={expenditure} />)}
                </article>
                <hr />
                <ExpenditureEdit />

                <h2 className="large text-primary">Assets</h2>
                <article className="articles">
                    {assets && assets.map(asset => <AssetEdit key={asset.id} asset={asset} />)}
                </article>
                <hr />
                <AssetEdit />
            </section>
        </Fragment>;
};

Settings.propTypes = {
    authData: PropTypes.object.isRequired,
    accountData: PropTypes.object.isRequired,
    assetData: PropTypes.object.isRequired,
    expenditureData: PropTypes.object.isRequired,
    incomeData: PropTypes.object.isRequired,
    liabilityData: PropTypes.object.isRequired,
    getAccounts: PropTypes.func.isRequired,
    getAssets: PropTypes.func.isRequired,
    getExpenditures: PropTypes.func.isRequired,
    getIncome: PropTypes.func.isRequired,
    getLiabilities: PropTypes.func.isRequired
};

const mapStateToProps = state => {
    return {
        authData: state.authData,
        accountData: state.accountData,
        assetData: state.assetData,
        expenditureData: state.expenditureData,
        incomeData: state.incomeData,
        liabilityData: state.liabilityData
    };
};

const mapDispatchToProps = {
    getAccounts,
    getAssets,
    getExpenditures,
    getIncome,
    getLiabilities
};

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Settings));
