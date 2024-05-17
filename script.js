document.addEventListener("DOMContentLoaded", () => {
    initializeLoggers();
    checkAndUpdateOnLoad();
    setInterval(checkAndUpdate, 60000); // Run checkAndUpdate every minute
});

function checkAndUpdateOnLoad() {
    const lastLoggedTime = new Date(localStorage.getItem("lastLoggedTime"));
    const currentTime = new Date();

    if (!lastLoggedTime || new Date(lastLoggedTime).getDate() !== currentTime.getDate()) {
        initializeLoggers(); // Reset logs
        updateGraph('water'); // Reset water intake graph
    }
}

function checkAndUpdate() {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    if (currentHour === 0 && currentMinute === 0) {
        initializeLoggers();
        updateGraph('water');
    }
}

function logActivity(type, status) {
    localStorage.setItem("lastLoggedTime", new Date().toISOString());
    const log = JSON.parse(localStorage.getItem(type));
    const today = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    if (!log.some(entry => entry.date === today)) {
        log.push({ date: today, status: status });
        localStorage.setItem(type, JSON.stringify(log));
        updateGraph(type);
        disableButtons(type);
    }
}


let chartInstances = {};

function initializeLoggers() {
    const logs = ["medicine", "exercise", "water"];
    logs.forEach(log => {
        if (!localStorage.getItem(log)) {
            localStorage.setItem(log, JSON.stringify([]));
        }
        updateGraph(log);
        disableButtonsIfLoggedToday(log);
    });
}

function logWater(amount) {
    const log = JSON.parse(localStorage.getItem("water"));
    const today = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    let entry = log.find(entry => entry.date === today);
    if (entry) {
        entry.amount += amount;
    } else {
        entry = { date: today, amount: amount };
        log.push(entry);
    }
    localStorage.setItem("water", JSON.stringify(log));
    updateGraph("water");
}

function logCustomWater() {
    const customAmount = parseInt(document.getElementById("custom-water").value);
    if (!isNaN(customAmount) && customAmount > 0) {
        logWater(customAmount);
    }
}

function updateGraph(type) {
    const log = JSON.parse(localStorage.getItem(type));
    const today = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    console.log(today)
    const graphElement = document.getElementById(`${type}-graph`);

    if (graphElement) {
        let labels = [];
        let data = [];
        log.forEach(entry => {
            labels.push(entry.date);
            data.push(type === "water" ? entry.amount : (entry.status === "yes" ? 1 : 0));
        });

        // Remove existing chart instance if it exists
        if (chartInstances[type]) {
            chartInstances[type].destroy();
        }

        // Chart options
        let options = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { 
                    title: { display: true, text: 'Day' } 
                },
                y: { 
                    title: { display: true, text: type === "water" ? 'Water Intake (ml)' : 'Status' },
                    ticks: {
                        callback: function(value) {
                            if (type === "water") {
                                return value;
                            } else {
                                return value === 1 ? 'Yes' : 'No';
                            }
                        },
                        stepSize: 1,
                        max: 1,
                        min: 0
                    }
                }
            }
        };

        // Create new chart instance
        chartInstances[type] = new Chart(graphElement, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: `${type.charAt(0).toUpperCase() + type.slice(1)} Log`,
                    data: data,
                    backgroundColor: type === "medicine" ? 'gold' : (type === "exercise" ? 'red' : '#1090d2')
                }]
            },
            options: options
        });
    }

    if (type === "water") {
        const todayLog = log.find(entry => entry.date === today) || { amount: 0 };
        const totalWater = 3100;
        const pieChartElement = document.getElementById("water-pie-graph");

        let consumedWater = todayLog.amount;
        let remainingWater = totalWater - consumedWater;

        if (remainingWater < 0) {
            remainingWater = 0;
        }

        // Remove existing pie chart instance if it exists
        if (chartInstances['water-pie']) {
            chartInstances['water-pie'].destroy();
        }

        // Create new pie chart instance
        chartInstances['water-pie'] = new Chart(pieChartElement, {
            type: 'pie',
            data: {
                labels: ['Water Drank', 'Remaining'],
                datasets: [{
                    data: [consumedWater, remainingWater],
                    backgroundColor: ['#1090d2', '#e0e0e0']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

function disableButtons(type) {
    if (type !== "water") {
        const buttons = document.querySelectorAll(`.${type}-logger .log-btn`);
        buttons.forEach(button => {
            button.disabled = true;
            button.classList.add('disabled');
        });
    }
}

function disableButtonsIfLoggedToday(type) {
    if (type !== "water") {
        const log = JSON.parse(localStorage.getItem(type));
        const today = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
        if (log.some(entry => entry.date === today)) {
            disableButtons(type);
        }
    }
}
