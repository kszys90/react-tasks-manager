import React from 'react';

class TasksManager extends React.Component {
    state = {
        tasks: [],
        timer: '',
        task: ''
    }
    intervalID = null
    api = 'http://localhost:3005/data'

    onClick = () => {
        const { tasks } = this.state;
        console.log(tasks)
        console.log(this.intervalID)
        console.log(this.state.task)
        console.log(this.state.timer)
    }

    setTimer(taskId) {
        const { tasks } = this.state
        this.setState(state => {
            const newTasks = state.tasks.map(task => {
                if (task.id === taskId) {
                    const currentTask = { ...task, isRunning: !task.isRunning }
                    this.updateTasks(currentTask, taskId)
                    return currentTask
                }
                return task;
            })
            return {
                tasks: newTasks
            }
        })
    }

    timer(taskId) {
        const currentTask = this.state.tasks.find(task => task.id === taskId)
        const { isRunning, time } = currentTask

        const timeState = () => {
            isRunning && time > 0 ? (this.startInterval(taskId)) : null
            isRunning && time === 0 ? (this.stopInterval()) : null
        }
        timeState()

        return time
    }

    startInterval(taskId) {
        if (this.intervalID === null) {
            this.intervalID = setInterval(() => this.decrementTime(taskId), 1000)
        }
    }

    stopInterval() {
        clearInterval(this.intervalID)
        this.intervalID = null
    }

    decrementTime(taskId) {
        this.setState(state => {
            const newTasks = state.tasks.map(task => {
                if (task.id === taskId && task.time > 0 && task.isRunning) {
                    const currentTask = { ...task, time: task.time - 1 }
                    this.updateTasks(currentTask, taskId)
                    return currentTask
                }
                if (!task.isRunning) this.stopInterval()
                return task
            })
            return {
                tasks: newTasks
            }
        })
        const currentTask = this.state.tasks.find(task => task.id === taskId)
        const { time } = currentTask
        return time
    }

    taskIsDone(taskId) {
        const { tasks } = this.state
        const currentTask = this.state.tasks.find(task => task.id === taskId)
        const { isRunning, isDone } = currentTask
        if (!isDone) {

            this.setState(state => {
                const newTasks = state.tasks.map(task => {
                    if (task.id === taskId) {
                        const currentTask = { ...task, isRunning: !task.isRunning, isDone: !task.isDone }
                        this.updateTasks(currentTask, taskId)
                        return currentTask
                    }
                    return task;
                })
                return {
                    tasks: newTasks
                }
            })
        }
    }

    toggleFinishBn(e) {
        if (e.time === 0 && !e.isDone) {
            return false
        }
        if (e.time === 0 && e.isDone) {
            return true
        }
        else return true
    }

    addTask(e) {
        const { tasks } = this.state
        const options = {
            method: 'POST',
            body: JSON.stringify(e),
            headers: { 'Content-Type': 'application/json' }
        }
        this._fetch(options)
            .then(data => {
                const id = data.id
                this.setState({
                    tasks: [...tasks, { ...e, id }],
                    task: '',
                    timer: ''
                })
            })
    }

    updateTasks(task, taskId) {
        const options = {
            method: 'PUT',
            body: JSON.stringify(task),
            headers: { 'Content-Type': 'application/json' }
        }
        this._fetch(options, taskId)
    }

    deleteTask(taskId) {
        this.setState(state => {
            const newTasks = state.tasks.map(task => {
                if (task.id === taskId) {
                    const currentTask = { ...task, isRemoved: true }
                    this.updateTasks(currentTask, taskId)
                    return currentTask
                }
                else return task
            })
            return {
                tasks: newTasks
            }
        })
    }

    _fetch(options, path = '') {
        const url = `${this.api}/${path}`
        return fetch(url, options)
            .then(resp => {
                if (resp.ok) return resp.json()
                return Promise.reject(resp)
            })
    }

    toggleSubmitButton() {
        if (this.state.task !== '' &&
            this.state.timer !== '' &&
            !isNaN(this.state.timer)) {
            return false
        }
        return true
    }

    createTask = () => {
        const { task, timer } = this.state
        return {
            name: task,
            time: timer,
            isRunning: false,
            isDone: false,
            isRemoved: false
        }
    }

    submitTask = (e) => {
        e.preventDefault()
        const newTask = this.createTask()
        this.addTask(newTask)
    }

    inputTaskOnChange = (e) => {
        const { value } = e.target
        this.setState({ task: value })
    }

    inputTimerOnChange = (e) => {
        const { value } = e.target
        this.setState({ timer: value })
    }

    renderTasks() {
        const { tasks } = this.state
        const filteredTasks = tasks.filter(e => e.isRemoved !== true)
        const sortedTasks = filteredTasks.sort((taskA, taskB) => taskA.isDone - taskB.isDone)
        return (sortedTasks.map((e) => {
            const timer = this.timer(e.id)
            return (
                <section
                    key={e.id}
                    className={'task__container main_container'}
                >
                    <header className={'task_title-container'}>
                        <div className={'task__name-container'}>
                            <h3>
                                {e.name}
                            </h3>
                        </div>
                        <div className={'task__name-container'}>
                            <h3>
                                Time to complete: {timer} s
                            </h3>
                        </div>
                    </header>
                    <footer className={'footer_container'}>
                        <div>
                            <button
                                onClick={() => this.setTimer(e.id)}
                                disabled={(timer !== 0 ? false : true)}
                            >
                                start / stop
                            </button>
                        </div>
                        <div>
                            <button
                                onClick={() => this.taskIsDone(e.id)}
                                disabled={(this.toggleFinishBn(e))}
                            >
                                finished
                            </button>
                        </div>
                        <div>
                            <button
                                onClick={() => this.deleteTask(e.id)}
                                disabled={!(e.isDone)}
                            >
                                delete
                            </button>
                        </div>
                    </footer>
                </ section >
            )
        }))
    }

    componentDidMount() {
        this._fetch()
            .then(data => {
                this.setState({
                    tasks: [...data]
                })
            })
    }

    componentDidUpdate() {
    }

    render() {
        return (
            <>
                <div
                    className={'title_container main_container'
                    }>
                    <h1
                        onClick={this.onClick}
                        className={'title'}
                    >
                        TasksManager
                    </h1>
                </div>
                <div>{this.renderTasks()} </div>
                <div className='separator_container'></div>
                <div className={'main_container'}>
                    <div>
                        <h2 className={'title'}>Add new Tasks</h2>
                        <div>
                            <form
                                onSubmit={this.submitTask}
                            >
                                <div className={'inputs_container'}>
                                    <div>
                                        <input
                                            className={'input-field'}
                                            value={this.state.task}
                                            onChange={this.inputTaskOnChange}
                                            placeholder={'Task name'}
                                        >
                                        </input>
                                    </div>
                                    <div>
                                        <input
                                            className={'input-field'}
                                            value={this.state.timer}
                                            onChange={this.inputTimerOnChange}
                                            placeholder={'Time to complete task (number [s])'}
                                        >
                                        </input>
                                    </div>
                                </div>
                                <div className='submit_container'>
                                    <input
                                        type="submit"
                                        value="Add new Task"
                                        disabled={this.toggleSubmitButton()}
                                    />
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </>
        )
    }

}

export default TasksManager;