const app = require('../index').app;

app.controller('AdminServerController', ['$scope', '$http', '$state', 'moment',
  ($scope, $http, $state, moment) => {
    $scope.setTitle('服务器');
    $http.get('/api/admin/server').then(success => {
      $scope.servers = success.data;
      $scope.servers.forEach(server => {
        server.flow = {};
        $http.get('/api/admin/flow/' + server.id, {
          params: {
            time: [
              moment().hour(0).minute(0).second(0).millisecond(0).toDate().valueOf(),
              moment().toDate().valueOf(),
            ],
          }
        }).then(success => {
          server.flow.today = success.data[0];
        });
        $http.get('/api/admin/flow/' + server.id, {
          params: {
            time: [
              moment().day(0).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf(),
              moment().toDate().valueOf(),
            ],
          }
        }).then(success => {
          server.flow.week = success.data[0];
        });
        $http.get('/api/admin/flow/' + server.id, {
          params: {
            time: [
              moment().date(1).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf(),
              moment().toDate().valueOf(),
            ],
          }
        }).then(success => {
          server.flow.month = success.data[0];
        });
        $http.get('/api/admin/flow/' + server.id, {
          params: {
            type: 'hour',
          }
        }).then(success => {
          const scaleLabel = (number) => {
            if(number < 1) {
              return number.toFixed(1) +' B';
            } else if (number < 1000) {
              return number.toFixed(0) +' B';
            } else if (number < 1000000) {
              return (number/1000).toFixed(0) +' KB';
            } else if (number < 1000000000) {
              return (number/1000000).toFixed(0) +' MB';
            } else if (number < 1000000000000) {
              return (number/1000000000).toFixed(1) +' GB';
            } else {
              return number;
            }
          };
          server.chart = {
            data: [success.data],
            labels: ['0', '', '', '15', '', '', '30', '', '', '45', '', ''],
            // labels: ['0', '', '', '', '', '', '6', '', '', '', '', '', '12', '', '', '', '', '', '18', '', '', '', '', '', ],
            series: 'day',
            datasetOverride: [{ yAxisID: 'y-axis-1' }],
            options: {
              tooltips: {
                callbacks: {
                  label: function(tooltipItem) {
                    return scaleLabel(tooltipItem.yLabel);
                  }
                }
              },
              scales: {
                yAxes: [
                  {
                    id: 'y-axis-1',
                    type: 'linear',
                    display: true,
                    position: 'left',
                    ticks: {
                      callback: scaleLabel,
                    },
                  }
                ]
              }
            },
          };
        });
      });
    });
    $scope.toServerPage = (serverId) => {
      $state.go('admin.serverPage', { serverId });
    };
    $scope.setFabButton(() => {
      $state.go('admin.addServer');
    });
  }
])
.controller('AdminServerPageController', ['$scope', '$state', '$stateParams', '$http', 'moment', '$mdDialog', 'adminApi', '$q',
  ($scope, $state, $stateParams, $http, moment, $mdDialog, adminApi, $q) => {
    $scope.setTitle('服务器');
    $scope.setMenuButton('arrow_back', function() {
      $state.go('admin.server');
    });
    $http.get('/api/admin/server/' + $stateParams.serverId).then(success => {
      $scope.server = success.data;
    }).catch(() => {
      $state.go('admin.server');
    });
    $scope.toAccountPage = port => {
      adminApi.getAccountId(port).then(id => {
        $state.go('admin.accountPage', { accountId: id });
      });
    };
    $scope.editServer = id => {
      $state.go('admin.editServer', { serverId: id });
    };
    $scope.deleteServer = id => {
      const confirm = $mdDialog.confirm()
        .title('')
        .textContent('删除服务器？')
        .ariaLabel('deleteServer')
        .ok('确认')
        .cancel('取消');
      $mdDialog.show(confirm).then(() => {
        return $http.delete('/api/admin/server/' + $stateParams.serverId);
      }).then(() => {
        $state.go('admin.server');
      }).catch(() => {

      });
    };

    $scope.flowType = 'day';
    const flowTime = {
      hour: Date.now(),
      day: Date.now(),
      week: Date.now(),
    };
    const flowLabel = {
      hour: ['0', '', '', '15', '', '', '30', '', '', '45', '', ''],
      day: ['0', '', '', '', '', '', '6', '', '', '', '', '', '12', '', '', '', '', '', '18', '', '', '', '', '', ],
      week: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    };
    const scaleLabel = (number) => {
      if(number < 1) {
        return number.toFixed(1) +' B';
      } else if (number < 1000) {
        return number.toFixed(0) +' B';
      } else if (number < 1000000) {
        return (number/1000).toFixed(0) +' KB';
      } else if (number < 1000000000) {
        return (number/1000000).toFixed(0) +' MB';
      } else if (number < 1000000000000) {
        return (number/1000000000).toFixed(1) +' GB';
      } else {
        return number;
      }
    };
    const setChart = (lineData, pieData) => {
      $scope.pieChart = {
        data: pieData.map(m => m.flow),
        labels: pieData.map(m => m.port + (m.username ? ` [${ m.username }]` : '')),
        options: {
          tooltips: {
            enabled: true,
            mode: 'single',
            callbacks: {
              label: function(tooltipItem, data) {
                const label = data.labels[tooltipItem.index];
                const datasetLabel = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                return label + ': ' + scaleLabel(datasetLabel);
              }
            }
          },
        },
      };
      $scope.lineChart = {
        data: [lineData],
        labels: flowLabel[$scope.flowType],
        series: 'day',
        datasetOverride: [{ yAxisID: 'y-axis-1' }],
        options: {
          tooltips: {
            callbacks: {
              label: function(tooltipItem) {
                return scaleLabel(tooltipItem.yLabel);
              }
            }
          },
          scales: {
            yAxes: [
              {
                id: 'y-axis-1',
                type: 'linear',
                display: true,
                position: 'left',
                ticks: {
                  callback: scaleLabel,
                },
              }
            ]
          }
        },
      };
    };
    $scope.getChartData = () => {
      $q.all([
        $http.get('/api/admin/flow/' + $stateParams.serverId, {
          params: {
            type: $scope.flowType,
            time: new Date(flowTime[$scope.flowType]),
          }
        }),
        $http.get('/api/admin/flow/' + $stateParams.serverId + '/user', {
          params: {
            type: $scope.flowType,
            time: new Date(flowTime[$scope.flowType]),
          }
        }),
      ])
      .then(success => {
        $scope.sumFlow = success[0].data.reduce((a, b) => {
          return a + b;
        }, 0);
        setChart(success[0].data, success[1].data);
      });
      if($scope.flowType === 'hour') {
        $scope.time = moment(flowTime[$scope.flowType]).format('YYYY-MM-DD HH:00');
      }
      if($scope.flowType === 'day') {
        $scope.time = moment(flowTime[$scope.flowType]).format('YYYY-MM-DD');
      }
      if($scope.flowType === 'week') {
        $scope.time = moment(flowTime[$scope.flowType]).day(0).format('YYYY-MM-DD') + ' / ' + moment(flowTime[$scope.flowType]).day(6).format('YYYY-MM-DD');
      }
    };
    $scope.getChartData();
    $scope.changeFlowTime = (number) => {
      const time = {
        hour: 3600 * 1000,
        day: 24 * 3600 * 1000,
        week: 7 * 24 * 3600 * 1000,
      };
      flowTime[$scope.flowType] += number * time[$scope.flowType];
      $scope.getChartData();
    };
  }
])
.controller('AdminAddServerController', ['$scope', '$state', '$stateParams', '$http',
  ($scope, $state, $stateParams, $http) => {
    $scope.setTitle('新增服务器');
    $scope.setMenuButton('arrow_back', function() {
      $state.go('admin.server');
    });
    $scope.methods = ['aes-256-cfb', 'aes-192-cfb'];
    $scope.server = {
      method: 'aes-256-cfb',
    };
    $scope.confirm = () => {
      $http.post('/api/admin/server', {
        name: $scope.server.name,
        address: $scope.server.address,
        port: +$scope.server.port,
        password: $scope.server.password,
        method: $scope.server.method || 'aes-256-cfb',
      }).then(success => {
        $state.go('admin.server');
      });
    };
    $scope.cancel = () => {
      $state.go('admin.server');
    };
  }
])
.controller('AdminEditServerController', ['$scope', '$state', '$stateParams', '$http',
  ($scope, $state, $stateParams, $http) => {
    $scope.setTitle('编辑服务器');
    $scope.setMenuButton('arrow_back', function() {
      $state.go('admin.serverPage', { serverId: $stateParams.serverId });
    });
    $scope.methods = ['aes-256-cfb', 'aes-192-cfb'];
    $http.get('/api/admin/server/' + $stateParams.serverId).then(success => {
      $scope.server = {
        name: success.data.name,
        address: success.data.host,
        port: +success.data.port,
        password: success.data.password,
        method: success.data.method || 'aes-256-cfb',
      };
    });
    $scope.confirm = () => {
      $http.put('/api/admin/server/' + $stateParams.serverId, {
        name: $scope.server.name,
        address: $scope.server.address,
        port: +$scope.server.port,
        password: $scope.server.password,
        method: $scope.server.method,
      }).then(success => {
        $state.go('admin.serverPage', { serverId: $stateParams.serverId });
      });
    };
    $scope.cancel = () => {
      $state.go('admin.serverPage', { serverId: $stateParams.serverId });
    };
  }
]);
