import React, { useState } from 'react';
import { connect } from 'react-redux';
import { updateAsset } from '../../actions/assets';

function AssetEdit({ asset = {}, updateAsset }) {
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
  };

  return (
    <div>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <input type="text" id="name" value={name} onChange={handleChange} placeholder="Name" required />
          <input type="text" id="value" value={value} onChange={handleChange} placeholder="Value" required />
          <input type="submit" value="Save" className="btn btn-primary my-1" />
        </div>
        <input type="hidden" id="id" value={asset.id} />
      </form>
    </div>
  );
}

const mapStateToProps = () => ({});

export default connect(mapStateToProps, { updateAsset })(AssetEdit);
