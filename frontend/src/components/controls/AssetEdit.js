import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { showConfirmation } from '../../actions/confirmations';
import { updateAsset, deleteAsset } from '../../actions/assets';

function AssetEdit({ asset, showConfirmation, updateAsset, deleteAsset }) {
  const [name, setName] = useState(asset.name);
  const [value, setValue] = useState(asset.value);

  const handleChange = (event) => {
    switch (event.target.id) {
      case 'name':
        setName(event.target.value);
        break;
      case 'value':
        setValue(event.target.value);
        break;
      default:
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    updateAsset({
      id: asset.id,
      name,
      value,
    });

    if (!asset.id) {
      clearForm();
    }
  };

  const handleDelete = () => {
    showConfirmation(
      'Delete Confirmation',
      'Delete Confirmation',
      'Are you sure you want to delete this record?',
      'Delete',
      () => {
        deleteAsset(asset.id);
      },
    );
  };

  const clearForm = () => {
    setName(AssetEdit.defaultProps.asset.name);
    setValue(AssetEdit.defaultProps.asset.value);
  };

  return (
    <div>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <input type="text" id="name" value={name} onChange={handleChange} placeholder="Name" required />
          <input type="text" id="value" value={value} onChange={handleChange} placeholder="Value" required />
          <input type="submit" value="Save" className="btn btn-primary my-1" />
          {asset.id && <input type="button" value="Delete" onClick={handleDelete} className="btn btn-primary my-1" />}
        </div>
        <input type="hidden" id="id" value={asset.id} />
      </form>
    </div>
  );
}

AssetEdit.propTypes = {
  asset: PropTypes.object,
  showConfirmation: PropTypes.func,
  updateAsset: PropTypes.func,
  deleteAsset: PropTypes.func,
};

AssetEdit.defaultProps = {
  asset: {
    name: '',
    value: 0,
  },
};

const mapStateToProps = () => ({});

export default connect(mapStateToProps, { showConfirmation, updateAsset, deleteAsset })(AssetEdit);
