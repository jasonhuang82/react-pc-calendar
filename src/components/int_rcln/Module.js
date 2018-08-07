import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import './css.scss';

class Module extends Component {


    componentDidMount () {
        if (this.labelDOM) this.forceUpdate();
    }

    handleChange = (e) => {
        if (this.props.onChange) {
            this.props.onChange(e, e.target.value);
        }
    }

    handleBlur = (e) => {
        if (this.props.onBlur) {
            this.props.onBlur(e, e.target.value);
        }
    }

    handleFocus = (e) => {
        if (this.props.onFocus) {
            this.props.onFocus(e, e.target.value);
        }
    }

    handleClick = (e) => {
        if (this.props.onClick) {
            this.props.onClick(e, e.target.value);
        }
    }

    _renderLabel = () => {

        const { label: labelText } = this.props;
        return (
            <label ref={e => { this.labelDOM = e }}
                onClick={() => { this.inputDOM.focus() }}
            >
                {labelText}
            </label>
        );

    }

    render () {
        const {
            className,
            placeholder,
            disabled,
            color,
            label,
            breakline,
            icon,
            readOnly,
            noBorder,
            request
        } = this.props;

        const dynamicPaddingLeft = this.labelDOM ? this.labelDOM.clientWidth + 16 : null;

        const classes = cx('int_rcln', color, className, {
            breakline: breakline || (icon && label),
            icon: icon,
            noBorder: noBorder,
            request: request
        });

        return (
            <div className={classes}>

                {icon}

                {label && this._renderLabel()}

                <input
                    ref={e => { this.inputDOM = e }}
                    type="text"
                    placeholder={placeholder}
                    disabled={disabled}
                    onInput={this.handleChange}
                    onBlur={this.handleBlur}
                    onFocus={this.handleFocus}
                    onClick={this.handleClick}
                    style={{ paddingLeft: dynamicPaddingLeft }}
                    value={this.props.value}
                    readOnly={readOnly}
                />
            </div>
        );
    }

}

// Props default value write here
Module.defaultProps = {
};

// Typechecking with proptypes, is a place to define prop api
Module.propTypes = {
    className: PropTypes.string,
    breakline: PropTypes.bool,
    disabled: PropTypes.bool,
    color: PropTypes.string,
    icon: PropTypes.element,
    readOnly: PropTypes.bool,
    noBorder: PropTypes.bool,
    request: PropTypes.bool
};

export default Module;
