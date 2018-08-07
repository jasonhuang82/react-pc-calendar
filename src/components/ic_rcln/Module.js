import React from 'react';
import PropTypes from 'prop-types';
import CSSModules from 'react-css-modules';
import styles from './css.scss';
import cx from 'classnames';


let Module = (props) => {
    const classes = cx(
        'ic_rcln',
        props.className,
        props.name,
        props.size,
        props.link ? 'link' : null,
        props.circular ? 'circular' : null,
        props.border ? 'border' : null,
        props.color
    );
    return (
        <i className={classes}></i>
    );
};

// Props default value write here
Module.defaultProps = {
    className: '',
    name: '',
    size: '',
    link: false,
    circular: false,
    border: false,
    color: ''
};

// Typechecking with proptypes, is a place to define prop api
Module.propTypes = {
    className: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    size: PropTypes.string.isRequired,
    link: PropTypes.bool.isRequired,
    circular: PropTypes.bool.isRequired,
    border: PropTypes.bool.isRequired,
    color: PropTypes.string.isRequired
};

export default CSSModules(Module, styles, {
    allowMultiple: true
});
