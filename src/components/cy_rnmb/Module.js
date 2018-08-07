import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
// import CSSModules from 'react-css-modules';
import cx from 'classnames';
import './css.scss';
// 引入別的組件
import IcRcln from '../ic_rcln/Module';
import IntRcln from '../int_rcln/Module';

import isIE from './isIEFunc';
// moment
import moment from 'moment';

class Module extends Component {
    constructor (props) {
        super(props);
        this.state = {
            isCalenderOpen: false,
            calendarData: [], // 月曆資料
            nowCalenderIndex: 0, // 目前顯示月曆位置
            calendarState: {
                'selectState': 'go',   // 月曆選擇狀態
                'startDate': this.props.defaultStartDate, // label 上的文字
                'backDate': this.props.defaultEndDate // label 上的文字
            }
        };
        // 是否還在 OneWay 日曆內
        this.isStillInCalender = false;
        // 外層預處理的Class
        this.moduleWrapClass = (() => {
            let className = 'cy_rnmb';
            if (this.props.moduleClassName && this.props.moduleClassName !== '') {
                className += ' ' + this.props.moduleClassName;
            }
            return className;
        })();
        // 要讓浮動視窗依附的Dom物件
        this.customContentDom = null;
        // 月曆Dom物件
        this.calenderDom = null;
        // 中文日期Title
        this.chinieseWeeks = ['日', '一', '二', '三', '四', '五', '六'];
        // 當input再(focus)輸入時，存入當下state做紀錄還原，在blur時檢查若是不合法就還原
        this.calendarStateClone = {
            'startDate': '',
            'backDate': ''
        };
        // 在mouseEnter時快照，等 panel 關閉若無isStart or isEnd 狀態就將資料 setState 回去
        this.calendarDataClone = null;
        // 在上方inputblur時，將月曆資料快照，在關閉時若有資料則採用input版的
        this.onInputBlurCalendarDataClone = null;
        // 在下方日期click時，將月曆資料快照，在關閉時若有資料則採用click版的
        this.onDateClickCalendarDataClone = null;
        // input onChange 時驗證是否成功，用於close時若值改變就觸發onChange
        this.isTriggerOnChangeCallBack = false;
    }
    // ====== 生命週期 ======
    // 初始化 moment
    componentDidMount () {
        //  初始化 moment
        this.setMoment();
        // 產生月曆
        let calendarData = this.produceCalendar(this.props.minDate, this.props.maxDate);
        // 鎖住不合理的日期
        calendarData = this.lockDefaultDisableDate(calendarData);
        // 預設串接input起始與結束日期
        calendarData = this.betweenInputStartDateToBackDate(calendarData);
        // 預設初始化時，將月曆資料存入暫存，預防第一次沒有選取日期時，沒有上一次紀錄的快照
        // 所以會將是undefined的快照復原導致程式錯誤
        this.calendarDataClone = calendarData;
        // 找尋今日日期並預設跳到該位置index
        // let todayMoment = moment().format('YYYY/MM/DD');
        // let nowCalenderIndex = this.findCalenderTableIndex(calendarData, todayMoment);
        // 找尋起始日期並將月曆預設跳到該位置index
        let startDate = this.state.calendarState.startDate;
        // 起始日期是空的時候，不要鎖定月曆位置
        let nowCalenderIndex = startDate !== '' ? this.findCalenderTableIndex(calendarData, startDate) : 0;
        // 存到state render View
        this.setState({ calendarData, nowCalenderIndex });
    }
    UNSAFE_componentWillReceiveProps (nextProps) {
        // 外部接到新的props時，去更新月曆日期資料，並驗證確保日期是在action 日期內不然就不給更新
        let calendarData = JSON.parse(JSON.stringify(this.state.calendarData));
        let calendarState = JSON.parse(JSON.stringify(this.state.calendarState));
        let isStartDateDiff = this.props.defaultStartDate !== nextProps.defaultStartDate;
        let isEndDateDiff = this.props.defaultEndDate !== nextProps.defaultEndDate;
        const validAllowDates = (date) => {
            // 驗證日期符合嚴格模式
            let isValid = moment(date, 'YYYY/MM/DD', true).isValid();
            // 驗證日期是否在合法範圍
            let isVailStateValue = this.isVailedDateRange(date);
            return (isValid && isVailStateValue) || date === '';
        };
        try {
            if (isStartDateDiff || isEndDateDiff) {
                if (this.props.mode === 'oneWay') {
                    console.log('componentWillReceiveProps oneWay', nextProps.defaultStartDate);
                    let isPropsStartDateValid = validAllowDates(nextProps.defaultStartDate);
                    if (isPropsStartDateValid) {
                        calendarState.startDate = nextProps.defaultStartDate;
                    }
                    else {
                        throw `請確認傳入日期格式是YYYY/MM/DD與必須在${this.props.activeStartDate}~${this.props.activeEndDate}之間`;
                    }
                    // calendarState.startDate = nextProps.defaultStartDate;
                }
                if (this.props.mode === 'doubleWay') {
                    console.log('componentWillReceiveProps doubleWay', nextProps.defaultStartDate);
                    if (isStartDateDiff === true) {
                        // calendarState.startDate = nextProps.defaultStartDate;

                        let isPropsStartDateValid = validAllowDates(nextProps.defaultStartDate);
                        if (isPropsStartDateValid) {
                            calendarState.startDate = nextProps.defaultStartDate;
                        }
                        else {
                            throw `起始日期請確認傳入日期格式是YYYY/MM/DD與必須在${this.props.activeStartDate}~${this.props.activeEndDate}之間`;
                        }


                    }
                    if (isEndDateDiff === true) {
                        // calendarState.backDate = nextProps.defaultEndDate;
                        let isPropsBackDateValid = validAllowDates(nextProps.defaultEndDate);
                        if (isPropsBackDateValid) {
                            calendarState.backDate = nextProps.defaultEndDate;
                        }
                        else {
                            throw `結束日期請確認傳入日期格式是YYYY/MM/DD與必須在${this.props.activeStartDate}~${this.props.activeEndDate}之間`;
                        }
                    }
                }
                calendarData = this.betweenInputStartDateToBackDate(calendarData, calendarState);
                // 在focus時，clone一份
                // 在click、onBlur、WillReceiveProps時，也就是會異動到正確日期資料時，要存一份起來
                // 供hover redo 使用
                this.calendarDataClone = calendarData;
                this.setState({ calendarState, calendarData });
            }
        }
        catch (err) {
            console.error(err);
        }
    }
    componentDidUpdate (prevProps, prevState, snapshot) {
    }

    // ====== 取得目標 ele 的座標位置 ======
    getDomPosition (elem, property) {
        if (property === 'top') return elem.getBoundingClientRect()[property] + document.documentElement.scrollTop;
        return elem.getBoundingClientRect()[property];
    }

    // ====== 開啟月曆 ======

    // 月曆內容打開，單程，去回程，去變更selectMode
    calenderContentOpen (clickMode = 'go') {
        let isCalenderOpen = true;
        let calendarState = JSON.parse(JSON.stringify(this.state.calendarState));
        // 把計算月曆位置放到開啟月曆時才做setState畫面更新，讓onBlur與接componentWillReceiveProps
        // 只要負責更新對的日期資料到state就好
        let nowCalenderIndex = this.countOpenCalendarIndex();
        if (this.props.mode === 'oneWay') {
            if (clickMode === 'go') {
                // console.log('去程模式');
            }
        }

        if (this.props.mode === 'doubleWay') {
            if (clickMode === 'go') {
                // console.log('去程模式');
                calendarState.selectState = 'go';
            }

            if (clickMode === 'back') {
                // console.log('回程模式');
                calendarState.selectState = 'back';
            }
        }

        this.setState({ isCalenderOpen, calendarState, nowCalenderIndex });

    }
    // 月曆內容關閉
    calenderContentClose () {
        console.log('isStillInCalender', this.isStillInCalender);

        if (this.isStillInCalender === false) {
            let cloneCalendarList = JSON.parse(JSON.stringify(this.state.calendarData));
            // 找尋起始日期並將月曆預設跳到該位置index
            // let startDate = this.state.calendarState.startDate;
            // let nowCalenderIndex = this.state.nowCalenderIndex;
            // hover Event State 處理
            if (this.props.mode === 'oneWay') {
                let isStartState = this.findSingleDaysState(cloneCalendarList, 'isStart');
                // 如果單程關閉時沒有isStart狀態且有click時的快照就復原程最後一次click的結果
                if (isStartState === false && this.calendarDataClone !== null) {
                    cloneCalendarList = this.calendarDataClone;
                }
                // 每次 關閉panel 都reset掉hover 至下方整理setState
                cloneCalendarList = this.resetCalenderDaysState(cloneCalendarList, ['isHover']);
            }

            if (this.props.mode === 'doubleWay') {
                // mouseEnter時hover狀態redo機制
                // 月曆中是否有起始日期 (若日期是從 onBlur 來，calendarData會被蓋掉)
                let hasStartState = this.findSingleDaysState(cloneCalendarList, 'isStart');
                // 月曆中是否有結束日期 (若日期是從 onBlur 來，calendarData會被蓋掉)
                let hasEndState = this.findSingleDaysState(cloneCalendarList, 'isEnd');
                // 去程狀態(click下去state就變back)且沒有click起始日期狀態
                let isSelectStateGoAndNoIsEndState = this.state.calendarState.selectState === 'back' && hasEndState === false;
                // 回程狀態(click下去state就變go)且沒有click結束日期狀態
                let isSelectStateBackAndNoIsStartState = this.state.calendarState.selectState === 'go' && hasStartState === false;
                // 去程狀態且沒有click起始日期狀態 或 回程狀態且沒有click結束日期狀態 的時候就將上次click完的舊狀態還原
                if (isSelectStateGoAndNoIsEndState === true || isSelectStateBackAndNoIsStartState === true) {
                    // console.log('mouseEnter時hover狀態!!');
                    cloneCalendarList = this.calendarDataClone;
                }
            }
            // 驗證成功若是從blur or click 結果暫存到屬性，給下方更新月曆
            const validDateCloneToRedo = (validDateCloneKey) => {
                cloneCalendarList = this[validDateCloneKey];
                this[validDateCloneKey] = null;
            };
            // date click 時，驗證成功將結果暫存到屬性，若是有這屬性在關閉時就取出並setState，並將該屬性清空
            if (this.onDateClickCalendarDataClone !== null) {
                // console.log('DateClick 成功並反應到畫面!!');
                validDateCloneToRedo('onDateClickCalendarDataClone');
            }
            // input blur 時，驗證成功將結果暫存到屬性，若是有這屬性在關閉時就取出並setState，並將該屬性清空
            else if (this.onInputBlurCalendarDataClone !== null) {
                // console.log('input blur 驗證成功並反應到畫面!!');
                validDateCloneToRedo('onInputBlurCalendarDataClone');
            }
            (async () => {
                await this.setState({
                    // nowCalenderIndex,
                    isCalenderOpen: false,
                    calendarData: cloneCalendarList
                });
                // 從blur那接過來關閉面板判斷觸發onChange
                this.triggerDateOnChange();
            })();
        }
    }

    // 計算月曆打開時，顯示位置於月曆打開時統一計算
    countOpenCalendarIndex (cloneCalendarList = this.state.calendarData) {
        let nowCalenderIndex = this.state.nowCalenderIndex;
        let startCalendarIndex = this.findCalenderTableIndex(cloneCalendarList, this.state.calendarState.startDate);
        let backCalendarIndex = this.findCalenderTableIndex(cloneCalendarList, this.state.calendarState.backDate);
        nowCalenderIndex = startCalendarIndex;
        if (this.props.mode === 'oneWay') {
            // 如果start預設位置為0
            if (startCalendarIndex === -1) {
                nowCalenderIndex = 0;
            }
        }

        if (this.props.mode === 'doubleWay') {
            // 沒有startDate位置就用backDate位置
            if (startCalendarIndex === -1) {
                // 預防backDate日期位置超過最後一個月曆
                if (backCalendarIndex > cloneCalendarList.length - 2) {
                    nowCalenderIndex = cloneCalendarList.length - 2;
                }
                else {
                    nowCalenderIndex = backCalendarIndex;
                }
            }
            // 如果start and back 都沒有，預防月曆位置找不到預設月曆位置為0
            if (backCalendarIndex === -1 && startCalendarIndex === -1) {
                nowCalenderIndex = 0;
            }
        }

        return nowCalenderIndex;
    }

    // ====== 整理 render 月曆資料 ======

    // 取得當下月曆資料
    getNowCalendarData () {
        return this.state.calendarData.slice(this.state.nowCalenderIndex, this.state.nowCalenderIndex + 2);
    }
    // 改變月曆資料位置箭頭Click Event
    changeCalendarIndex (value = 0) {
        let nowCalenderIndex = this.state.nowCalenderIndex;
        if (value && value !== 0) {
            nowCalenderIndex = parseInt(this.state.nowCalenderIndex) + parseInt(value);
        }
        if (nowCalenderIndex < 0) {
            nowCalenderIndex = 0;
        }
        // 不要目前位置大於length -2 ，是因為月曆都是一次出現2個最後面資料也是呈現2筆，所以最大位置為第二筆位置
        if (nowCalenderIndex > this.state.calendarData.length - 2) {
            nowCalenderIndex = this.state.calendarData.length - 2;
        }
        console.log('changeCalendarIndex');
        this.setState({ nowCalenderIndex }, () => {
            // 為了讓 click 箭頭時，會setState抽換react Dom 換成新物件
            // 為了保持下方panel 所以在setState完保持focus狀態
            this.calenderDom.focus();
        });
    }
    // 月曆日期尚class狀態
    calenderDaysClass (dateItem, dateIndex) {
        let classStrArr = ['cy_rnmb_main_content_calender_body_day'];
        // 加入日期class
        let weekClass = this.addWeekClass(dateItem.date);
        if (weekClass !== '') {
            classStrArr.push(weekClass);
        }
        // 日期狀態
        if (dateItem.isDisable === true) {
            classStrArr.push('disabled');
        }

        if (dateItem.isToday === true) {
            classStrArr.push('isToday');
        }

        if (dateItem.isHoliday === true) {
            classStrArr.push('isHoliday');
        }

        if (dateItem.isHover === true) {
            classStrArr.push('isHover');
        }

        if (dateItem.isStart === true) {
            classStrArr.push('isStart');
        }

        if (dateItem.isEnd === true) {
            classStrArr.push('isEnd');
        }

        if (dateItem.isBetween === true) {
            classStrArr.push('isBetween');
        }
        return classStrArr.join(' ');
    }
    // 月曆星期title列 Class
    calenderTitleClass (weekIndex) {
        let classStrArr = ['cy_rnmb_main_content_calender_body_week'];
        let weekClassStr = '';
        weekClassStr = this.addWeekClass(null, weekIndex);
        if (weekClassStr !== '') {
            classStrArr.push(weekClassStr);
        }
        if (weekIndex === 0 || weekIndex === this.chinieseWeeks.length - 1) {
            classStrArr.push('isHoliday');
        }
        return classStrArr.join(' ');
    }
    // 傳入日期加入星期class (傳入特定日期, 直接給予星期次序(選填))
    // 欲使用直接給星期方式第一個參數可接null (js 星期從0 === 星期日)
    addWeekClass (date, weekDay = null) {
        let weekClass = '';
        let nowWeek = weekDay === null ? moment(date).day() : weekDay;
        // 日期 class
        switch (nowWeek) {
            case 0:
                weekClass = 'sun';
                break;
            case 1:
                weekClass = 'mon';
                break;
            case 2:
                weekClass = 'tue';
                break;
            case 3:
                weekClass = 'wed';
                break;
            case 4:
                weekClass = 'thu';
                break;
            case 5:
                weekClass = 'fri';
                break;
            case 6:
                weekClass = 'sat';
                break;
        }
        return weekClass;
    }

    // ===== 變更月曆日期state =====

    // 鎖定不合理的日期為disable
    lockDefaultDisableDate (dateArr) {
        // let formatStr = 'YYYY/MM/DD'
        return dateArr.map(items => {
            items.dateDayList.map(item => {
                let isBeforeActiveStartDate = moment(item.date).isBefore(this.props.activeStartDate);
                let isAfterActiveEndDate = moment(item.date).isAfter(this.props.activeEndDate);
                if (isBeforeActiveStartDate || isAfterActiveEndDate) {
                    item.isDisable = true;
                }
                return item;
            });
            return items;
        });
    }
    // input Blur start & end betwwen，預設dimount執行，與input Blur 時將起始日與結束日串接
    // 若需要使用自訂的 calendarState 去串接月曆，則設定第二參數
    betweenInputStartDateToBackDate (calendarData, calendarStateOuter = undefined) {
        let calendarState = JSON.parse(JSON.stringify(this.state.calendarState));
        if (calendarStateOuter !== undefined) {
            calendarState = calendarStateOuter;
        }
        return calendarData.map(items => {
            items.dateDayList = items.dateDayList.map(item => {
                item.isStart = false;
                item.isEnd = false;
                item.isBetween = false;
                item.isHover = false;
                let nowDateMoment = moment(item.date);
                // 如果有isStartState，就亮startDate
                if (calendarState.startDate !== '') {
                    if (nowDateMoment.isSame(calendarState.startDate)) {
                        item.isStart = true;
                    }
                }
                // 去回程模式才需要串接去回程日期
                if (this.props.mode === 'doubleWay') {
                    // 如果有isEndState，就亮EndDate
                    if (calendarState.backDate !== '') {
                        if (nowDateMoment.isSame(calendarState.backDate)) {
                            item.isEnd = true;
                        }
                    }
                    // 如果isStartState && isEndState都有，就串接兩者中間
                    if (calendarState.startDate !== '' && calendarState.backDate !== '') {
                        if (nowDateMoment.isBetween(calendarState.startDate, calendarState.backDate)) {
                            item.isBetween = true;
                        }
                    }
                }
                return item;
            });
            return items;
        });
    }
    // click 從起始日(可指定)between倒結束，在去回程模式回程時click
    betweenFromStartToEnd (cloneCalendarList, startDate, backDate) {
        return cloneCalendarList.map(items => {
            items.dateDayList.map(item => {
                // 預設先重置所有between && isEnd 狀態，在下方判斷若是本日期是跟backDate一樣且不是disable的格子就設定isEnd(終點)狀態
                item.isEnd = false;
                item.isBetween = false;
                let selfDate = moment(item.date);
                // 只要在去程日期回程 中間的日期且是合理日期的都選取起來
                if (selfDate.isBetween(startDate, backDate) && !item.isDisable) {
                    item.isBetween = true;
                }
                // 在是click最後一天上標記isEnd狀態
                if (selfDate.isSame(backDate) && !item.isDisable) {
                    item.isEnd = true;
                }
                return item;
            });
            return items;
        });
    }
    // hover模式從起始日(可指定)between倒結束 (目前處理月曆, 要between起始日期, 要between結束日期, 執行模式, 當下hover的日期)
    betweenFromHoverToStartOrEnd (cloneCalendarList, startDate, backDate, dateMode = 'isEnd', hoverDate) {
        return cloneCalendarList.map(items => {
            items.dateDayList.map(item => {
                // 預設先重置所有between && isHover 狀態與目前執行的模式state EX:目前回程模式就將isEnd State Reset掉
                item[dateMode] = false;
                item.isBetween = false;
                item.isHover = false;
                let selfDate = moment(item.date);
                // 只要在去程日期回程 中間的日期且是合理日期的都選取起來
                let isStartBeforeBackDate = moment(startDate).isBefore(backDate);
                // 如果起始日在結束日前就用 start between 到backDate
                if (isStartBeforeBackDate === true) {
                    if (selfDate.isBetween(startDate, backDate) && !item.isDisable) {
                        item.isBetween = true;
                    }
                }
                // 若start 在back 日期之後就拿back當作開啟日 between到startDate
                else {
                    if (selfDate.isBetween(backDate, startDate) && !item.isDisable) {
                        item.isBetween = true;
                    }
                }
                // 讓當下hover到日期isHover亮起
                if (selfDate.isSame(hoverDate) && !item.isDisable) {
                    item.isHover = true;
                }
                return item;
            });
            return items;
        });
    }

    // 將驗證成功日期State 存到暫存區，給Close時去更新月曆
    betweenCalendarData (calendarState = undefined) {
        let calendarData = JSON.parse(JSON.stringify(this.state.calendarData));
        console.log('calendarState !== undefined', calendarState !== undefined);

        if (calendarState !== undefined) {
            calendarData = this.betweenInputStartDateToBackDate(calendarData, calendarState);
        }
        else {
            calendarData = this.betweenInputStartDateToBackDate(calendarData);
        }
        // 驗證成功後，供hover redo 使用
        this.calendarDataClone = calendarData;
        // 驗證成功後，驗證過且between資料統一給Close去 setState 更新畫面
        this.onInputBlurCalendarDataClone = calendarData;
    }
    // ===== 月曆日期事件 =====

    // 月曆日期 MouseEnter event
    /*
    isHover 作用是當panel close時，因為在 mouseEnter 會hover的state
    */
    calenderDaysOnMouseEnter (e, dateItem, dateIndex) {
        // 整理資料再一次setState
        let cloneCalendarList = JSON.parse(JSON.stringify(this.state.calendarData));
        // 每次hover都reset掉hover
        cloneCalendarList = this.resetCalenderDaysState(cloneCalendarList, ['isHover']);
        // 取得月曆與日期位置
        let tdIndex = dateIndex;
        let tableIndex = this.findCalenderTableIndex(cloneCalendarList, dateItem.date);
        // MouseEnter 那包物件, hover到的日期
        let nowTargetDateDayObj = cloneCalendarList[tableIndex].dateDayList[tdIndex];
        // 將當下日期亮起
        nowTargetDateDayObj.isHover = true;
        // 將剛剛isHover State存回state
        cloneCalendarList[tableIndex].dateDayList[tdIndex] = nowTargetDateDayObj;
        if (this.props.mode === 'oneWay') {
            // 單程hover將isStart全取消，讓isHover取代亮點，且在close時判斷是否有無click 產生的isStart狀態
            // 沒有就復原程就狀態
            cloneCalendarList = this.resetCalenderDaysState(cloneCalendarList, ['isStart']);
        }

        if (this.props.mode === 'doubleWay') {
            // 是否有起始狀態
            let hasStartState = this.findSingleDaysState(cloneCalendarList, 'isStart');
            // 是否有結束狀態
            let hasEndState = this.findSingleDaysState(cloneCalendarList, 'isEnd');
            // 目前起始日期
            let startDate = this.getStartOrBackDate(cloneCalendarList, 'isStart');
            // 目前結束日期
            let backDate = this.getStartOrBackDate(cloneCalendarList, 'isEnd');
            // 去程無isEnd結束日狀態
            let isSelectStateGoAndNoIsEndState = this.state.calendarState.selectState === 'go' && hasEndState === false;
            // 回程無isStart起始日狀態
            let isSelectStateBackAndNoIsStartState = this.state.calendarState.selectState === 'back' && hasStartState === false;
            // 只要不足起始狀態以及結束狀態就視同單一日期hover，狀態全清除
            if (isSelectStateGoAndNoIsEndState === true || isSelectStateBackAndNoIsStartState === true) {
                cloneCalendarList = this.resetCalenderDaysState(cloneCalendarList, ['isStart', 'isBetween', 'isEnd']);
            }
            // 去程
            if (this.state.calendarState.selectState === 'go') {
                // 去程有isEnd結束日狀態
                if (hasEndState === true) {
                    // Debug
                    // console.log('去程有isEnd結束日狀態');
                    // let backDate = this.getStartOrBackDate(cloneCalendarList, 'isEnd');
                    // 去程hover日與end date做串接，所以isStart&isBetween State應該每次hover都取消狀態
                    cloneCalendarList = this.resetCalenderDaysState(cloneCalendarList, ['isStart', 'isBetween']);
                    // "去程模式"用hover日期與結束日期作between狀態
                    cloneCalendarList = this.betweenFromHoverToStartOrEnd(cloneCalendarList, nowTargetDateDayObj.date, backDate, 'isStart', nowTargetDateDayObj.date);
                }
            }

            // 回程
            if (this.state.calendarState.selectState === 'back') {
                // 回程有isStart起始日狀態
                if (hasStartState === true) {
                    // Debug
                    // console.log('回程有isStart起始日狀態');
                    // let startDate = this.getStartOrBackDate(cloneCalendarList, 'isStart');
                    // 去程hover日與start date做串接，所以isEnd&isBetween State應該每次hover都取消狀態
                    cloneCalendarList = this.resetCalenderDaysState(cloneCalendarList, ['isEnd', 'isBetween']);
                    // "回程模式"用起始日期與hover日期作between狀態
                    cloneCalendarList = this.betweenFromHoverToStartOrEnd(cloneCalendarList, startDate, nowTargetDateDayObj.date, 'isEnd', nowTargetDateDayObj.date);
                }
            }
        }
        this.setState({
            calendarData: cloneCalendarList
        });
    }
    // 月曆日期 click event
    calenderDaysOnClick (e, dateItem, dateIndex) {
        // 月曆開啟狀態
        let isCalenderOpen = this.state.isCalenderOpen;
        // 整理資料再一次setState
        let cloneCalendarList = JSON.parse(JSON.stringify(this.state.calendarData));
        // 取得月曆與日期位置
        let tdIndex = dateIndex;
        let tableIndex = this.findCalenderTableIndex(cloneCalendarList, dateItem.date);
        // Debug
        // console.log(`在第${tableIndex}月曆`);
        // click 下去那包物件
        let nowTargetDateDayObj = cloneCalendarList[tableIndex].dateDayList[tdIndex];
        // 複製目前calendarState state 並經過整理後，在最下方統一setState
        let calendarState = JSON.parse(JSON.stringify(this.state.calendarState));
        if (dateItem.isDisable === true) {
            console.log('click到無效日期!!');
        }
        else {
            // 去程
            if (this.props.mode === 'oneWay') {
                // 將isStart 狀態reset掉
                cloneCalendarList = this.resetCalenderDaysState(cloneCalendarList, ['isStart']);
                // 1.記錄當下日期到isStart
                nowTargetDateDayObj.isStart = true;
                calendarState.startDate = nowTargetDateDayObj.date;
                cloneCalendarList[tableIndex].dateDayList[tdIndex] = nowTargetDateDayObj;
                // 2.關閉月曆
                isCalenderOpen = false;
                // 3.在click時快照，等 panel 關閉若無isStart or isEnd 狀態就將資料 setState 回去
                // 在 click 要複製一包state去reset isStart 狀態
                // 當沒有click 新的 isStart時(panel關閉)就依照舊的isStart狀態去render View
                // 在 click 去回 要複製一包state 給去回hover時沒有click日期使用
            }
            // 去回程
            if (this.props.mode === 'doubleWay') {
                if (this.state.calendarState.selectState === 'go') {
                    // 去回程去程模式行為
                    cloneCalendarList = this.doubleWayDaysOnClickGoMode(cloneCalendarList, nowTargetDateDayObj, calendarState);
                }

                if (this.state.calendarState.selectState === 'back') {
                    // 設定結束位置
                    nowTargetDateDayObj.isEnd = true;
                    // 找出起始日期
                    let backDate = nowTargetDateDayObj.date;
                    // 找尋有無isStart的狀態
                    let isStartState = this.findSingleDaysState(cloneCalendarList, 'isStart');
                    // 有的話將start到end都between起來
                    if (isStartState) {
                        // 找出起始日，與結束日比較
                        let startDate = this.getStartOrBackDate(cloneCalendarList, 'isStart');
                        // 開始日是否在結束日之前
                        let isStartBeforeisEnd = moment(startDate).isBefore(backDate);
                        // 開始日在結束日前就執行回程模式
                        if (isStartBeforeisEnd === true) {
                            // 有起始日且在結束日之前執行回程模式，在關閉月曆
                            isCalenderOpen = false;
                            // 從起始日between倒結束
                            cloneCalendarList = this.betweenFromStartToEnd(cloneCalendarList, startDate, backDate);
                            // 設定State目前選擇狀態為 go
                            calendarState.selectState = 'go';
                            // 設定State去程日期
                            calendarState.backDate = backDate;
                        }
                        // 開始日在結束日之後，那就執行去回去程模式行為
                        if (isStartBeforeisEnd === false) {
                            // 去回程去程模式行為
                            cloneCalendarList = this.doubleWayDaysOnClickGoMode(cloneCalendarList, nowTargetDateDayObj, calendarState);
                        }
                    }
                    else {
                        // 沒有起始日(預先click回程)就執行，去回程去程模式行為
                        cloneCalendarList = this.doubleWayDaysOnClickGoMode(cloneCalendarList, nowTargetDateDayObj, calendarState);
                    }
                }
                // // 在 click 去回 要複製一包state 給去回hover時沒有click日期使用
            }
            // 在 click 去回 要複製一包state 給去回hover時沒有click日期使用
            this.calendarDataClone = cloneCalendarList;
            // 在下方日期click時，將月曆資料快照，在關閉時若有資料則採用click版的
            // 讓close時去
            this.onDateClickCalendarDataClone = cloneCalendarList;
            (async () => {
                await this.setState({
                    isCalenderOpen,
                    calendarData: cloneCalendarList,
                    calendarState
                });
                // 為了讓 click 日期時，會setState抽換react Dom 換成新物件
                // 為了保持下方panel 所以在setState完保持focus狀態
                this.calenderDom.focus();
                // click去回程時，去程不會關閉 panel 不會執行close function 所以在click event也要判斷觸發onChange
                this.isTriggerOnChangeCallBack = true;
                this.triggerDateOnChange();
            })();
        }
    }
    // 去回程去程模式 click 行為
    doubleWayDaysOnClickGoMode (cloneCalendarList, nowTargetDateDayObj, calendarState) {
        // 每次去程都重來計算行為
        // 是否有結束日期狀態
        let hasIsEndState = this.findSingleDaysState(cloneCalendarList, 'isEnd');
        // 找出reset前上一次結束日期
        let backDate = this.getStartOrBackDate(cloneCalendarList, 'isEnd');
        // 找出起始日期
        let startDate = nowTargetDateDayObj.date;
        // 重置所有state狀態，取消isStart And isEnd And isBetween
        cloneCalendarList = this.resetCalenderDaysState(cloneCalendarList, ['isStart', 'isEnd', 'isBetween']);
        // 設定起始位置
        nowTargetDateDayObj.isStart = true;
        // 設定State目前選擇狀態為 back
        calendarState.selectState = 'back';
        // 設定State去程日期
        calendarState.startDate = startDate;

        if (hasIsEndState === true) {
            if (moment(startDate).isAfter(backDate)) {
                console.log('目前click日期比EndDate大');
                calendarState.backDate = '';
            }
        }
        return cloneCalendarList;
    }

    // ====== 功能 func ======

    // 找到起始 isStart |結束日期 isEnd
    getStartOrBackDate (cloneCalendarList, dateKey) {
        return cloneCalendarList.reduce((total, current) => {
            current.dateDayList.forEach(item => {
                if (item[dateKey] === true) {
                    total = item.date;
                }
            });
            return total;
        }, '');
    }
    // 找到特定日期在哪個月曆(整包月曆物件, 特定日期 )
    findCalenderTableIndex (calendarData, dateStr) {
        return calendarData.findIndex((items, index) => {
            // 往下找單一月曆有無與今日日期相符項目
            let findIndex = items.dateDayList.findIndex((obj, i) => moment(dateStr).isSame(obj.date));
            // 告訴上層 loop 今日是否在此月曆
            return findIndex !== -1;
        });
    }
    // 找尋月曆中這屬性狀態是ture的
    findSingleDaysState (cloneCalendarList, dayStateKey) {
        let isStartState = false;
        cloneCalendarList.map(items => {
            items.dateDayList.map(item => {
                if (item[dayStateKey] === true) {
                    isStartState = true;
                }
                return item;
            });
            return items;
        });
        return isStartState;
    }
    // reset掉月曆所有日期狀態為false ,(需reset 陣列, 要reset的key複數使用陣列傳入) ['isHover','isStart', 'isEnd']
    resetCalenderDaysState (cloneCalendarList, dayStateArr) {
        return cloneCalendarList.map(items => {
            items.dateDayList.map(item => {
                dayStateArr.forEach(dayState => { item[dayState] = false });
                return item;
            });
            return items;
        });
    }

    // ====== 從外部取得狀態 ======

    // 取得目前月曆狀態
    getCalendarInfo () {
        let calendarState = {};

        if (this.props.mode === 'oneWay') {
            calendarState = {
                startDate: this.state.calendarState.startDate
            };
        }

        if (this.props.mode === 'doubleWay') {
            calendarState = JSON.parse(JSON.stringify(this.state.calendarState));
        }
        return calendarState;
    }
    // 取得幾晚
    getNightCount () {
        let cloneCalendarList = this.state.calendarData;
        let startDate = this.getStartOrBackDate(cloneCalendarList, 'isStart');
        let backDate = this.getStartOrBackDate(cloneCalendarList, 'isEnd');
        let totalNight = null;
        if (startDate !== '' && backDate !== '') {
            totalNight = 0;
            cloneCalendarList.forEach(items => {
                items.dateDayList.forEach(item => {
                    let currentDate = item.date;
                    let isBetweenStartAndBefore = moment(currentDate).isBetween(startDate, backDate);
                    let isNotDisable = !item.isDisable;
                    let isStartNight = moment(currentDate).isSame(startDate);
                    // 如果再開始跟結束中間的日期就選起來，但第一天的晚上也算一個晚上
                    if ((isBetweenStartAndBefore && isNotDisable) || isStartNight) {
                        totalNight++;
                    }
                });
            });
        }
        return totalNight;
    }
    // ====== input 日期資料 ======

    // 是否觸發props onChange callback，在 click 完 與 panel Close (input blur)時觸發
    triggerDateOnChange () {
        let isStartDateChange = this.calendarStateClone.startDate !== this.state.calendarState.startDate;
        let isBackDateChange = this.calendarStateClone.backDate !== this.state.calendarState.backDate;
        if (this.isTriggerOnChangeCallBack === true) {
            // debug
            // console.log('Clone startDate', this.calendarStateClone.startDate);
            // console.log('State startDate', this.state.calendarState.startDate);
            // console.log('Clone backDate', this.calendarStateClone.backDate);
            // console.log('State backDate', this.state.calendarState.backDate);
            // debug
            if (this.props.mode === 'oneWay') {
                if (isStartDateChange) {
                    this.props.onChange(this.getCalendarInfo());
                }
            }
            if (this.props.mode === 'doubleWay') {
                if (isStartDateChange || isBackDateChange) {
                    this.props.onChange(this.getCalendarInfo());
                }
            }
            this.isTriggerOnChangeCallBack = false;
        }
    }

    // 當input blur時驗證日期
    vailDateState (e, stateKey, stateValue) {

        // focus 時紀錄當下的State，以供驗證錯誤時redo
        if (e.type === 'focus') {
            this.calendarStateClone.startDate = this.state.calendarState.startDate;
            this.calendarStateClone.backDate = this.state.calendarState.backDate;
        }
        // blur 時驗證日期若不合法就還原
        if (e.type === 'blur') {
            let calendarState = JSON.parse(JSON.stringify(this.state.calendarState));
            try {
                // 上次輸入的與這次輸入的不同，代表是需要onChange，一樣的話calendarState也不需要setState
                if (this.calendarStateClone[stateKey] !== stateValue) {
                    // 當 onBlur 字串是空 string 時，讓input清空，
                    // 且反應到月曆state，跟著清空(isStart || isEnd) && isBetween
                    if (stateValue === '') {
                        // let calendarState = JSON.parse(JSON.stringify(this.state.calendarState));
                        // blur的input清空
                        calendarState[stateKey] = '';
                        let calendarData = JSON.parse(JSON.stringify(this.state.calendarData));
                        // 將空字串結果反應到月曆做between
                        calendarData = this.betweenInputStartDateToBackDate(calendarData, calendarState);
                        // 驗證成功後，驗證過且between資料統一給Close去 setState 更新畫面
                        this.onInputBlurCalendarDataClone = calendarData;
                        // 驗證成功後，供hover redo 使用
                        this.calendarDataClone = calendarData;
                        // 單程驗證成功用於關閉時是否執行callback
                        this.isTriggerOnChangeCallBack = true;
                    }
                    // 若onBlur 字串不為空則進行驗證，成功則反應到月曆，不成功則redo
                    if (stateValue !== '') {
                        // let isValid = this.isValidDate(stateValue);
                        let isValid = moment(stateValue, 'YYYY/MM/DD', true).isValid();
                        // stateKey === 'startDate' || 'backDate'
                        // calendarState[stateKey] = this.calendarStateClone[stateKey];
                        // 將 input 當下blur 值反映到state
                        calendarState[stateKey] = stateValue;
                        // 驗證日期 並 字串需有10個字
                        if (isValid && stateValue.length === 10) {
                            // 驗證格式成功
                            // console.log('驗證格式成功');
                            // blur 事件在input 或panel失去焦點，去關閉panel，但只需要監聽 input blur時去做between
                            if (this.isStillInCalender === false) {
                                // 驗證日期是否在可click範圍內
                                // 日期驗證 flag
                                let isVailRange = false;
                                // 驗證當下onBlur的日期是不是在Range內
                                let isVailStateValue = this.isVailedDateRange(stateValue);
                                // 驗證成功並於關閉時執行onchange callback
                                if (isVailStateValue) {
                                    isVailRange = true;
                                    this.isTriggerOnChangeCallBack = true;
                                }
                                if (isVailRange === true) {

                                    if (this.props.mode === 'oneWay') {
                                        // 將驗證成功日期State 存到暫存區，給Close時去更新月曆
                                        this.betweenCalendarData(calendarState);
                                    }
                                    if (this.props.mode === 'doubleWay') {
                                        // 去程時判斷是否在回程值之後
                                        // 回程時判斷是否在去程值之前
                                        // 是就不合法 要redo
                                        // 不是則是合法並反應到月曆狀態
                                        console.log('stateKey', stateKey);
                                        // 當下輸入的值要用 stateValue 不然會是上次紀錄的
                                        console.log('clone 上一次的 calendarState', calendarState);

                                        if (stateKey === 'startDate' && calendarState.backDate !== '') {
                                            if (moment(stateValue).isAfter(calendarState.backDate)) {
                                                throw `去程日期不能在回程日期之後!!`;
                                            }
                                        }
                                        if (stateKey === 'backDate' && calendarState.startDate !== '') {
                                            if (moment(stateValue).isBefore(calendarState.startDate)) {
                                                throw `回程日期不能在去程日期之前!!`;
                                            }
                                        }
                                        // 若沒有錯誤則反應到暫存區，給Close時去更新月曆
                                        this.betweenCalendarData(calendarState);
                                    }
                                }
                                else {
                                    throw `選取日期在${this.props.activeStartDate}~${this.props.activeEndDate}之間的日期`;
                                }
                            }
                        }
                        else {
                            throw `請輸入正確日期格式YYYY/MM/DD EX:${moment().format('YYYY/MM/DD')}!!`;
                        }
                    }
                }
                else {
                    this.onInputBlurCalendarDataClone = null;
                }
            }
            catch (err) {
                // 驗證不成功，將在 focus時 clone calendarState資料復原
                alert(err);
                calendarState = Object.assign({}, calendarState, this.calendarStateClone);
                this.setState({ calendarState });
            }
        }
    }

    // 驗證日期是否在可選日期內Func
    isVailedDateRange (vailDate) {
        if (!moment(vailDate).isBetween(this.props.activeStartDate, this.props.activeEndDate) &&
            !moment(vailDate).isSame(this.props.activeStartDate) &&
            !moment(vailDate).isSame(this.props.activeEndDate)
        ) {
            return false;
        }
        return true;
    }

    // input value綁定state
    onChangeDateState (e, stateKey) {
        let calendarState = JSON.parse(JSON.stringify(this.state.calendarState));
        calendarState[stateKey] = e.target.value;
        this.setState({ calendarState });
    }
    // ====== props 處理畫面 =====

    // 判斷props是否需要icon
    isShowIconFunc () {
        if (this.props.isShowIcon === true) {
            return <IcRcln name="tooldate" className="cy_rnmb_search_panel_icon" />;
        }
        return null;
    }
    // 判斷props是否需要isReq
    isReqFunc (mode) {
        let isReq = this.props.isReq === true;
        let isLabelStartDateNotEmpty = this.props.labelStartDateText !== '';
        let isLabelBackDateNotEmpty = this.props.labelBackDateText !== '';
        if (isReq) {
            if (mode === 'isStart' && isLabelStartDateNotEmpty) {
                return true;
            }
            if (mode === 'isEnd' && isLabelBackDateNotEmpty) {
                return true;
            }
        }
        return false;
    }
    // 判斷props是否需要isBorderStyle
    isBorderStyleFunc () {
        if (this.props.isBorderStyle === true) {
            return <div className="cy_rnmb_search_panel_border"></div>;
        }
        return <div className="int_rcln_calender_sign p-b-xs">~</div>;
    }
    // ====== 處理Date ======
    // 設定moment初始化
    setMoment () {
        moment.locale('zh-tw');
    }
    // 轉換成中文年月
    getChineseDate (date) {
        let formatDate = `${date}/01`;
        let isValid = this.isValidDate(formatDate);
        if (isValid) {
            return moment(formatDate).format('YYYY年MM月');
        }

    }
    // 取得開始到結束日區間年月
    getDateDiffArr (minMon, maxMon) {
        /*
        Target: 取出目標起始到結束總共有幾月，拿來當要map的總月曆數
        1.用moment 算出相差月份數，(若起始月份加上相差月份小於結束月份，需加一不然最後一個月會少算)
        2.並用起始+相差月份作為結束月 與 起始月份做loop並用 array 存年月的 title
        3.最後回傳
        */
        let isValid = this.isValidDate(minMon) && this.isValidDate(maxMon);
        if (isValid) {
            minMon = moment(minMon).format('YYYY/MM/DD');
            maxMon = moment(maxMon).format('YYYY/MM/DD');
            // 計算相差 明天render start to end
            let totalDateArr = [];
            // 日期月份相差預設會少1要+1抵銷回來
            let diffMonths = this.countDiffMonth(minMon, maxMon);
            // 如果開始月份加上相差月份還小於結束月份就會將相差月份補齊與結束月份一樣
            if (moment(minMon).add(diffMonths, 'months').month() < moment(maxMon).month()) {
                diffMonths++;
            }
            // 用起始月份加上相差月份 === 要render結束的月份
            let endMon = parseInt(moment(minMon).month()) + parseInt(diffMonths);
            // 產出所有需要印出的日曆標頭，並同時決定要印幾個
            for (let startMon = parseInt(moment(minMon).month()); startMon <= endMon; startMon++) {
                let monthStr = new Date(moment(minMon).year(), this.autoFillZero(startMon)).toISOString();
                let dateStr = moment(monthStr).format('YYYY/MM');
                totalDateArr.push(dateStr);
            }
            return totalDateArr;
        }
    }
    // 產生月曆
    produceCalendar (minMon, maxMon) {
        let isValid = this.isValidDate(minMon) && this.isValidDate(maxMon);
        if (isValid) {
            // 產生月曆所需物件
            let totalDateArr = [];
            let allDateYearMonth = this.getDateDiffArr(minMon, maxMon); // 產出月曆標頭並決定要印幾個月曆
            allDateYearMonth.map((items, index) => {
                // 取得結束 = > 開始 相差月數
                let nowMonthObj = { // 純當月的表頭&&所有日期物件
                    dateTitle: items,
                    dateDayList: []
                };
                let nowMonthArr = []; // 純單月份所有的日期 給 nowMonthObj.dateDayList push 新資料
                let renderDays = `${items}/01`; // 為了用moment驗證日期需先轉換成 YYYY/MM/DD格式
                let isValid = this.isValidDate(renderDays);
                if (isValid) {
                    // 取年與月讓迴圈生呈每日日期
                    let yearAndMonthStr = moment(renderDays).format('YYYY/MM');
                    // 取得當月有幾天
                    renderDays = this.getDaysInMonth(renderDays);
                    // 生成整包當月天數物件
                    for (let dayCount = 1; dayCount <= renderDays; dayCount++) {
                        let dayCountClone = this.autoFillZero(dayCount.toString()); // 將loop 計算出日期數
                        let dateClone = yearAndMonthStr + '/' + dayCountClone; // 組成 YYYY/MM/DD格式
                        // 取得今日日期並格式化(YYYY/MM/DD)字串給moment不然isSame會格式錯誤永遠都false
                        // 使用最小日期當作今日
                        // let formatTodayObj = moment(moment(minMon).format('YYYY/MM/DD'));
                        // let isToday = formatTodayObj.isSame(dateClone);

                        // 使用今日日期當作今日
                        let formatTodayObj = moment(moment().format('YYYY/MM/DD'));
                        let isToday = formatTodayObj.isSame(dateClone);
                        nowMonthArr.push(
                            {
                                day: dayCount,
                                date: dateClone,
                                isStart: false,
                                isEnd: false,
                                isDisable: false,
                                isHoliday: this.isHoliday(dateClone),
                                isToday: isToday,
                                isBetween: false,
                                isHover: false
                            }
                        );
                    }
                    nowMonthObj.dateDayList = nowMonthArr;
                    totalDateArr.push(nowMonthObj);
                }
            });
            return totalDateArr;
        }
    }
    // 需要知道當下月份是從星期幾開始然後決定要推擠格 td
    getDaysInMonthPushGap (date, dayCount) {
        let isValid = this.isValidDate(date);
        if (isValid && dayCount === 1) {
            let firstDay = this.getMonthFirstDay(date);
            let marginGap = ((100 / 7) * firstDay) + '%';
            // debug mode
            // console.log('margin-left 推了 : ' + marginGap);
            return {
                'marginLeft': marginGap
            };
        }
    }
    // 自動補零
    autoFillZero (dayCount) {
        let dayCountClone = dayCount.toString();
        while (dayCountClone.length < 2) {
            dayCountClone = '0' + dayCountClone;
        }
        return dayCountClone;
    }
    // 相差月份計算 == 總共要跑幾個 月曆 第一層
    countDiffMonth (minMon, maxMon) {
        let isValid = this.isValidDate(minMon) && this.isValidDate(maxMon);
        if (isValid) {
            let minDate = moment(minMon);
            let maxDate = moment(maxMon);
            let diffMonth = maxDate.diff(minDate, 'month');
            // debug mode
            // console.log(`${minDate.format('YYYY/MM/DD')} 到 ${maxDate.format('YYYY/MM/DD')} 相差 ${diffMonth} 月`);
            return diffMonth;
        }
    }
    // 計算這個月有幾天 用於迴圈跑月立時每個月"天"的次數 第二層
    getDaysInMonth (date) {
        let isValid = this.isValidDate(date);
        if (isValid) {
            let momentObj = moment(date);
            let dayInMonthCount = momentObj.daysInMonth();
            // debug Mode
            // console.log(`${momentObj.format('YYYY/MM/DD')} 當月天數 = ${dayInMonthCount}`);
            return dayInMonthCount;
        }
    }
    // 驗證日期方法
    isValidDate (date) {
        let day = moment(date);
        if (day.isValid()) {
            return true;
        }
        else {
            console.log('輸入無效日期');
            return false;

        }
    }
    // 取得當月第一天
    getMonthFirstDay (date) {
        let isValid = this.isValidDate(date);

        if (isValid) {
            let day = moment(date);
            let dayStr = day.startOf('month').format('YYYY-MM-DD');
            dayStr = moment(dayStr);
            // debug mode
            // console.log(`${day.format('YYYY/MM/DD')} 當月第一天為星期 ${dayStr.day()}`);
            return dayStr.day();
        }
    }
    // 確定日期是否為假日
    isHoliday (date) {
        let isValid = this.isValidDate(date);
        if (isValid) {
            let day = moment(date);
            day = day.day();
            if (day === 0 || day === 6) {
                return true;
            }
            else {
                return false;
            }
        }
    }

    // ====== View Render ======
    // ====== 劃出月曆 ======

    contentRenderComponent () {
        // 處理箭頭位置與泡泡框容器位置 css
        const styles = (() => {
            if (this.customContentDom) {
                return {
                    top: this.getDomPosition(this.customContentDom, 'top') + this.getDomPosition(this.customContentDom, 'height'),
                    left: this.getDomPosition(this.customContentDom, 'left')
                };
            }
            else {
                return null;
            }
        })();

        let ContentComponent = (
            <div
                className={
                    cx('cy_rnmb_main_content', {
                        open: this.state.isCalenderOpen
                    })
                }
                style={styles}
                tabIndex="-1"
                onMouseDown={e => { this.isStillInCalender = true }}
                onMouseUp={e => { this.isStillInCalender = false }}
                onBlur={e => { this.calenderContentClose() }}
                ref={e => { this.calenderDom = e }}
            >
                {
                    this.getNowCalendarData().map((calenderListItems, calenderListIndex) => {
                        return (
                            <div
                                className="cy_rnmb_main_content_calender"
                                key={calenderListItems.dateTitle}
                            >
                                <div className="cy_rnmb_main_content_calender_header">
                                    {
                                        // 左邊箭頭
                                        (() => {
                                            if (calenderListIndex % 2 === 0) {
                                                return (
                                                    <div
                                                        className={
                                                            cx('cy_rnmb_main_content_calender_header_prev', {
                                                                disabled: this.state.nowCalenderIndex === 0
                                                            })
                                                        }
                                                        // IE 在click箭頭時，會自動關起panel
                                                        onClick={e => {
                                                            // IE以外brower
                                                            if (!isIE()) {
                                                                this.changeCalendarIndex(-1);
                                                            }
                                                        }}
                                                        onMouseDown={e => {
                                                            // IE 執行
                                                            if (isIE()) {
                                                                this.isStillInCalender = true;
                                                                this.changeCalendarIndex(-1);
                                                            }
                                                        }}
                                                        onMouseUp={e => {
                                                            // IE 執行
                                                            if (isIE()) {
                                                                this.isStillInCalender = false;
                                                            }
                                                        }}
                                                    >
                                                        <IcRcln name="toolbefore" />
                                                    </div>
                                                );
                                            }
                                            else {
                                                return <div></div>;
                                            }
                                        })()
                                    }
                                    <div className="cy_rnmb_main_content_calender_header_title">
                                        {this.getChineseDate(calenderListItems.dateTitle)}
                                    </div>

                                    {
                                        // 右邊箭頭
                                        (() => {
                                            if (calenderListIndex % 2 === 1) {
                                                return (
                                                    <div
                                                        className={
                                                            cx('cy_rnmb_main_content_calender_header_next', {
                                                                disabled: this.state.nowCalenderIndex + 1 === this.state.calendarData.length - 1
                                                            })
                                                        }
                                                        onClick={e => {
                                                            // IE以外brower
                                                            if (!isIE()) {
                                                                this.changeCalendarIndex(1);
                                                            }
                                                        }}
                                                        onMouseDown={e => {
                                                            // IE 執行
                                                            if (isIE()) {
                                                                this.isStillInCalender = true;
                                                                this.changeCalendarIndex(1);
                                                            }
                                                        }}
                                                        onMouseUp={e => {
                                                            // IE 執行
                                                            if (isIE()) {
                                                                this.isStillInCalender = false;
                                                            }
                                                        }}
                                                    >
                                                        <IcRcln name="toolnext" />
                                                    </div>
                                                );
                                            }
                                            else {
                                                return <div></div>;
                                            }
                                        })()
                                    }
                                </div>
                                <div className="cy_rnmb_main_content_calender_body">
                                    <ul className="cy_rnmb_main_content_calender_body_weeks">
                                        {
                                            this.chinieseWeeks.map((date, i) => {
                                                return (
                                                    <li
                                                        className={this.calenderTitleClass(i)}
                                                        key={i}
                                                    >
                                                        {date}
                                                    </li>
                                                );
                                            })
                                        }
                                    </ul>
                                    <ul className="cy_rnmb_main_content_calender_body_days">
                                        {
                                            calenderListItems.dateDayList.map((dateItem, dateIndex) => {
                                                return (
                                                    <li
                                                        key={dateItem.date}
                                                        className={
                                                            this.calenderDaysClass(dateItem, dateIndex)
                                                        }
                                                        style={
                                                            (() => this.getDaysInMonthPushGap(dateItem.date, dateItem.day))()
                                                        }
                                                        onMouseEnter={e => { this.calenderDaysOnMouseEnter(e, dateItem, dateIndex) }}
                                                        // onClick={e => this.calenderDaysOnClick(e, dateItem, dateIndex)}
                                                        onClick={e => {
                                                            if (!isIE()) {
                                                                this.calenderDaysOnClick(e, dateItem, dateIndex);
                                                            }
                                                        }}
                                                        onMouseDown={e => {
                                                            // IE 執行
                                                            if (isIE()) {
                                                                this.isStillInCalender = true;
                                                                this.calenderDaysOnClick(e, dateItem, dateIndex);
                                                            }
                                                        }}
                                                        onMouseUp={e => {
                                                            // IE 執行
                                                            if (isIE()) {
                                                                this.isStillInCalender = false;
                                                            }
                                                        }}
                                                    >
                                                        {dateItem.day}
                                                    </li>
                                                );
                                            })
                                        }
                                    </ul>
                                </div>
                            </div>
                        );
                    })
                }
            </div>
        );
        return ReactDOM.createPortal(ContentComponent, document.body);
    }

    render () {
        return (
            <div
                className={this.moduleWrapClass}
                ref={el => { this.customContentDom = el }}
            >
                <div
                    className={
                        cx('cy_rnmb_custom_content', {
                            open: this.state.isCalenderOpen
                        })
                    }
                >
                    {
                        (() => {
                            if (this.props.mode === 'oneWay') {
                                return (
                                    <div className={cx('cy_rnmb_search_panel oneWay', {
                                        isFocus: this.state.isCalenderOpen
                                    })}>
                                        {this.isShowIconFunc()}
                                        <IntRcln
                                            value={this.state.calendarState.startDate}
                                            placeholder="YYYY/MM/DD"
                                            breakline
                                            request={this.isReqFunc('isStart')}
                                            className="int_rcln_calender"
                                            label={this.props.labelStartDateText}
                                            noBorder
                                            readOnly={this.props.isReadOnly}
                                            onFocus={e => {
                                                // focus時紀錄startDate上次正確的值
                                                this.vailDateState(e, 'startDate', this.state.calendarState.startDate);
                                                // 打開月曆
                                                this.calenderContentOpen('go');
                                            }}
                                            onBlur={e => {
                                                console.log('onBlur');

                                                // blur時驗證startDate的值
                                                this.vailDateState(e, 'startDate', this.state.calendarState.startDate);
                                                // 關閉月曆
                                                this.calenderContentClose();
                                            }}
                                            onChange={e => {
                                                this.onChangeDateState(e, 'startDate');
                                            }}
                                        />
                                    </div>
                                );
                            }

                            if (this.props.mode === 'doubleWay') {
                                return (
                                    <div className={cx('cy_rnmb_search_panel doubleWay', {
                                        isFocus: this.state.isCalenderOpen,
                                        isBorder: this.props.isBorderStyle
                                    })}>
                                        {this.isShowIconFunc()}
                                        <IntRcln
                                            breakline
                                            noBorder
                                            className="int_rcln_calender"
                                            placeholder="YYYY/MM/DD"
                                            request={this.isReqFunc('isStart')}
                                            label={this.props.labelStartDateText}
                                            readOnly={this.props.isReadOnly}
                                            value={this.state.calendarState.startDate}
                                            onFocus={e => {
                                                // focus時紀錄startDate上次正確的值
                                                this.vailDateState(e, 'startDate', this.state.calendarState.startDate);
                                                // 打開月曆
                                                this.calenderContentOpen('go');

                                            }}
                                            onBlur={e => {
                                                // blur時驗證startDate的值
                                                this.vailDateState(e, 'startDate', this.state.calendarState.startDate);
                                                // 關閉月曆
                                                this.calenderContentClose();
                                            }}
                                            onChange={e => {
                                                this.onChangeDateState(e, 'startDate');
                                            }}
                                        />
                                        {this.isBorderStyleFunc()}
                                        <IntRcln
                                            breakline
                                            noBorder
                                            className="int_rcln_calender"
                                            placeholder="YYYY/MM/DD"
                                            request={this.isReqFunc('isEnd')}
                                            label={this.props.labelBackDateText}
                                            readOnly={this.props.isReadOnly}
                                            value={this.state.calendarState.backDate}
                                            onFocus={e => {
                                                // focus時紀錄 backDate 上次正確的值
                                                this.vailDateState(e, 'backDate', this.state.calendarState.backDate);
                                                // 打開月曆
                                                this.calenderContentOpen('back');
                                            }}
                                            onBlur={e => {
                                                // blur時驗證 backDate 的值
                                                this.vailDateState(e, 'backDate', this.state.calendarState.backDate);
                                                // 關閉月曆
                                                this.calenderContentClose();
                                            }}
                                            onChange={e => {
                                                this.onChangeDateState(e, 'backDate');
                                            }}
                                        />
                                        {
                                            (() => {
                                                // 都沒有設定需要晚數或天數，就甚麼都不 build，不然flexbox會報版
                                                if (this.props.isNight === false && this.props.isDays === false) {
                                                    return null;
                                                }
                                                else {
                                                    // 幾晚或幾天擇一顯示，至少有一個是true，才要build天數晚數
                                                    if (this.props.isNight === true && this.getNightCount() !== null) {
                                                        return <div className="int_rcln_calender_night p-b-xs">，共{this.getNightCount()}晚</div>;
                                                    }
                                                    if (this.props.isDays === true && this.getNightCount() !== null) {
                                                        return <div className="int_rcln_calender_night p-b-xs">，共{parseInt(this.getNightCount()) + 1}天</div>;
                                                    }
                                                    // 晚樹無法計算時將內容清空
                                                    if (this.getNightCount() === null) {
                                                        return <div className="int_rcln_calender_night p-b-xs"></div>;
                                                    }
                                                }
                                            })()
                                        }
                                    </div>
                                );
                            }
                        })()
                    }
                </div>
                {this.contentRenderComponent()}
            </div>
        );
    }
}


// 日期只接受 YYYY/MM/DD 格式!!!
Module.defaultProps = {
    moduleClassName: '',
    mode: 'oneWay', // oneWay|doubleWay
    isNight: false, // 是否需要幾晚
    isDays: false,  // 是否需要幾天與幾晚擇一
    isShowIcon: false, // 是否要show Icon
    isReq: false, // 是否必填欄位
    isBorderStyle: false, // 是否有border樣式
    isReadOnly: false, // 是否readOnly
    labelStartDateText: '去程日期', // 起始日期label上文字(單程時只需填起始日期)，若不需要就給空字串
    labelBackDateText: '', // 結束日期label上文字
    minDate: moment().subtract(2, 'months').format('YYYY/MM/DD'), // 劃出月曆最小日期
    maxDate: moment().add(4, 'months').format('YYYY/MM/DD'), // 預設比今日多 4個月 ，劃出月曆最大日期
    activeStartDate: moment().subtract(2, 'day').format('YYYY/MM/DD'), // 限制可點擊最小日期範圍
    activeEndDate: moment().add(4, 'months').subtract(5, 'day').format('YYYY/MM/DD'), // 限制可點擊最大日期範圍
    defaultStartDate: '', // input 起始日預設值 (單程時只需填起始日期)
    defaultEndDate: '', // input 結束日預設值
    onChange (changeDate) { // input 中日期變動時觸發
        console.log('onChange callBack');
        console.log('目前 change的Date', changeDate);
    }
};
// type: array string
Module.propTypes = {
    moduleClassName: PropTypes.string.isRequired,
    mode: PropTypes.string.isRequired,
    minDate: PropTypes.string.isRequired,
    maxDate: PropTypes.string.isRequired,
    activeStartDate: PropTypes.string.isRequired,
    activeEndDate: PropTypes.string.isRequired,
    isNight: PropTypes.bool.isRequired,
    isDays: PropTypes.bool.isRequired,
    isShowIcon: PropTypes.bool.isRequired,
    isReq: PropTypes.bool.isRequired,
    isBorderStyle: PropTypes.bool.isRequired,
    isReadOnly: PropTypes.bool.isRequired,
    labelStartDateText: PropTypes.string.isRequired,
    labelBackDateText: PropTypes.string.isRequired,
    defaultStartDate: PropTypes.string.isRequired,
    defaultEndDate: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
};
/**
 * Render Notice：
 * 1. render 裡 setState 會造成回圈，setState -> render -> setState -> render ...
 * 2. 在render前的 setSatae 放在 componentWillMount，render 後的放在 componentDidMount
 * 3. 不要使用 array 的 index 為 keys，可針對該內容 hash 後為 key
 */

export default Module;