import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import CyRnmb from './components/cy_rnmb/Module';
import './components/core/core.scss';

import moment from 'moment';

class Demo extends Component {
    constructor (props) {
        super(props);
        this.state = {
            oneWayDate: moment().subtract(2, 'day').format('YYYY/MM/DD'),
            doubleWayStartDate: moment().subtract(2, 'day').format('YYYY/MM/DD'),
            doubleWayBackDate: moment().add(20, 'day').format('YYYY/MM/DD'),
        };
    }
    componentDidMount () {
    }

    componentDidUpdate (prevProps, prevState, snapshot) {
    }  
    render () {
        return (
            <div>
                <h1 style={{ margin: '15px 0px'}}>Style:單程月曆</h1>
                <div style={{ width: '170px'}}>
                    <CyRnmb
                        mode="oneWay"
                        isShowIcon
                        isReq
                        defaultStartDate={this.state.oneWayDate}
                        onChange={(dateState) => {
                            console.log('onChange', dateState);

                        }}
                    />
                </div>
                <h1 style={{ margin: '15px 0px' }}>Style:去回程雙月曆-有寬度限制時</h1>
                <div style={{ width: '360px' }}>
                    <CyRnmb
                        mode="doubleWay"
                        isShowIcon
                        isNight
                        isReq
                        defaultStartDate={this.state.doubleWayStartDate}
                        defaultEndDate={this.state.doubleWayBackDate}
                        minDate="2018/04/03"
                        maxDate={moment().add(4, 'months').format('YYYY/MM/DD')}
                        activeStartDate="2018/04/24"
                        activeEndDate={moment().add(4, 'months').subtract(5, 'day').format('YYYY/MM/DD')}
                        labelStartDateText="住房日期"
                        labelBackDateText="退房日期"
                        isReadOnly
                    />
                </div>
                <h1 style={{ margin: '15px 0px' }}>Style:去回程雙月曆-有晚數</h1>
                <CyRnmb
                    mode="doubleWay"
                    isShowIcon
                    isBorderStyle
                    isNight
                    isReq
                    // defaultStartDate="2018/04/28"
                    // defaultEndDate={moment().add(1, 'months').format('YYYY/MM/DD')}
                    defaultStartDate={this.state.doubleWayStartDate}
                    defaultEndDate={this.state.doubleWayBackDate}
                    minDate="2018/04/03"
                    maxDate={moment().add(4, 'months').format('YYYY/MM/DD')}
                    activeStartDate="2018/04/24"
                    activeEndDate={moment().add(4, 'months').subtract(5, 'day').format('YYYY/MM/DD')}
                    labelStartDateText="住房日期"
                    labelBackDateText="退房日期"
                    onChange={(dateState) => {
                        console.log('onChange', dateState);

                    }}
                />
                <h1 style={{ margin: '15px 0px' }}>Style:去回程雙月曆</h1>
                <CyRnmb
                    mode="doubleWay"
                    isShowIcon
                    isBorderStyle
                    isReq
                    defaultStartDate="2018/04/28"
                    defaultEndDate={moment().add(1, 'months').format('YYYY/MM/DD')}
                    minDate="2018/04/03"
                    maxDate={moment().add(4, 'months').format('YYYY/MM/DD')}
                    activeStartDate="2018/04/24"
                    activeEndDate={moment().add(4, 'months').subtract(5, 'day').format('YYYY/MM/DD')}
                    labelStartDateText="住房日期"
                    labelBackDateText="退房日期"
                />
                <h1 style={{ margin: '15px 0px' }}>Style:去回程雙月曆-無月曆icon</h1>
                <CyRnmb
                    moduleClassName="test"
                    mode="doubleWay"
                    isDays
                    isReq
                    defaultStartDate="2018/04/28"
                    defaultEndDate="2018/04/30"
                    minDate="2018/04/03"
                    maxDate={moment().add(4, 'months').format('YYYY/MM/DD')}
                    activeStartDate="2018/04/24"
                    activeEndDate={moment().add(4, 'months').subtract(5, 'day').format('YYYY/MM/DD')}
                />
            </div>
        );
    }
}

ReactDOM.render(
    <Demo />,
    document.getElementById('root')
);
