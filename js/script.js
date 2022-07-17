
// // observer that looks for circular skill charts to animate upon the objects intersecting with the view window
// var observer = new IntersectionObserver(entries => {
//     entries.forEach(entry => {
//         var circle_chart = entry.target.querySelector('.circular-chart');
//         if (entry.isIntersecting) {
//             // add the circle 'progress' animation if we intersect with the chart wrapper
//             circle_chart.add('circle');
//             return;
//         }
//         // otherwise remove the class if we're not interesecting
//         circle_chart.remove('circle');
//     });
// });

// // observer object observing for the 'circular-chart' class to come into view
// observer.observe(document.querySelector('.circular-chart'));
