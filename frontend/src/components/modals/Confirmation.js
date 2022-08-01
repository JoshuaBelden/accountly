import PropTypes from 'prop-types';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { connect } from 'react-redux';
import { hideConfirmation } from '../../actions/confirmations';

function Confirmation({ confirmation, hideConfirmation }) {
  const handleClose = () => {
    hideConfirmation();
  };

  const handleHide = () => {
    hideConfirmation();
  }

  const handleConfirm = () => {
    confirmation.action();
    hideConfirmation();
  };

  return (
    <Modal show={confirmation.show} size="lg" aria-labelledby="contained-modal-title-vcenter" centered>
      <Modal.Header closeButton onHide={handleHide}>
        <Modal.Title id="contained-modal-title-vcenter">{confirmation.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h4>{confirmation.Header}</h4>
        <p>{confirmation.message}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={handleClose} variant="secondary">
          Close
        </Button>
        <Button onClick={handleConfirm} variant="danger">
          {confirmation.confirmButtonText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

Confirmation.propTypes = {
  hideConfirmation: PropTypes.func,
  confirmation: PropTypes.object,
};

const mapStateToProps = (state) => {
  return {
    confirmation: state.confirmationData,
  };
};

export default connect(mapStateToProps, { hideConfirmation })(Confirmation);
