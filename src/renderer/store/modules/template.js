const template = {
    state: {
        testData: ""
    },
    mutations: {
        TEST_COMMIT: (state, data) => {
            state.testData = data
        }
    },
    actions: {
        TEST_ACTION(commit, data) {
            commit("TEST_COMMIT", data)
        }
    }
}

export default template
