App = {
  web3Provider: null,
  contracts: {},
	
  init: function() {
    $.getJSON('../real-estate.json', function (data) {
      var list = $('#list');
      var template = $('#template');
      //json 데이터를 template에 출력해준다.
      for (i = 0; i < data.length; i++) {
        template.find('img').attr('src', data[i].picture);
        template.find('.id').text(data[i].id);
        template.find('.type').text(data[i].type);
        template.find('.area').text(data[i].area);
        template.find('.price').text(data[i].price);

        list.append(template.html());
      }
    })

    return App.initWeb3();
  },

  initWeb3: function () {
    //metamask 설치여부 체크함
    if (typeof web3 !== 'undefined') {
      //web3Provier 전역변수에 공급자를 불러온다.
      //metamask가 설치되어 있으면 metamask를 web3 공급자로 사용
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(App.web3Provider);
    } else {
      //metamask가 설치되어 있지 않으면 web3를 인스턴스화할 때 
      //필요한 공급자를 내 로컬 노드로(ganache) 대신 사용한다.
      App.web3Provider = new web3.providers.HttpProvider('http://localhost:8545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    //web3 가 스마트 컨트랙트 인스턴스를 찾을 수 있게  
    //스마트 컨트랙트를 인스턴스화 한다.
    //truffle에서 제공하는 library(truffle-contract.js)를 이용한다.
    //build 디렉토리의 RealEstate artifact 파일(ABI,컨트랙 배포된 주소)을 불러온다. 
    $.getJSON('RealEstate.json', function (data) {
      //읽은 data를 TruffleContract에 전달하여 컨트랙트를 인스턴스화 시킨다.
      App.contracts.RealEstate = TruffleContract(data);
      //App.web3Provider를 컨트랙트의 공급자로 설정한다.
      App.contracts.RealEstate.setProvider(App.web3Provider);
      return App.listenToEvents();
    });
  },

  buyRealEstate: function () {	
    var id = $('#id').val();
    var name = $('#name').val();
    var price = $('#price').val();
    var age = $('#age').val();

    //web3를 통해 Node의 계정들을 불러온다.
    web3.eth.getAccounts(function (error, accounts) { 
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      //컨트랙트 연결
      App.contracts.RealEstate.deployed().then(function (instance) {
        //name 한글 인코딩 utf8.js 사용
        var nameUtf8Encoded = utf8.encode(name);
        //encoding 된 값을 hexa 로 변환함
        return instance.buyRealEstate(id, web3.toHex(nameUtf8Encoded), age,
          { from: account, value: price });
      }).then(function () {
        $('#name').val('');
        $('#age').val('');
        $('#buyModal').modal('hide'); 
        //return App.loadRealEstates();
      }).catch(function (err) {
        console.log(err.message);
      })
      
    });
   },

  loadRealEstates: function() {
    App.contracts.RealEstate.deployed().then(function (instance) {
      return instance.getAllBuyers.call();
    }).then(function (buyers) {
      for (i = 0; i < buyers.length; i++){
        if (buyers[i] !== '0x0000000000000000000000000000000000000000') {
          //매물이 팔리면 image 변경
          var imgType = $('.panel-realEstate').eq(i).find('img').attr('src').substr(7);
          switch (imgType) {
            case 'apartment.jpg':
              $('.panel-realEstate').eq(i).find('img').attr('src', 'images/apartment_sold.jpg')
              break;
            case 'townhouse.jpg':
              $('.panel-realEstate').eq(i).find('img').attr('src', 'images/townhouse_sold.jpg')
              break;
            case 'house.jpg':
              $('.panel-realEstate').eq(i).find('img').attr('src', 'images/house_sold.jpg')
              break;
          }//switch
          //매입 버튼 텍스트를 매각으로 바꾸고, 비활성화 시킴
          $('.panel-realEstate').eq(i).find('.btn-buy').text('매각').attr('disabled', true);
          //매입자 정보 버튼의 display:none style 제거하기
          $('.panel-realEstate').eq(i).find('.btn-buyerInfo').removeAttr('style');
        }
      }
    }).catch(function (err) {
      console.log(err.message);
    })
  },
	
  listenToEvents: function () {
    App.contracts.RealEstate.deployed().then(function (instance) {
      //RealEstate의 LogBuyRealEstate 호출
      //첫번째 인자 : 필터링 옵션은 지정하지 않음
      //두번째 인자 : 블록의 범위를 지정함
      //watch : event 발생을 감지함
    instance.LogBuyRealEstate({}, {fromBlock:0, toBlock:'latest'}).watch(function (error, event) {
        //에러가 없다면 events DIV에 계정주소와 매물ID를 출력한다.
        if (!error) {
          $('#events').append('<p>' + event.args._buyer + ' 계정에서 ' + event.args._id +
            ' 번 매물을 매입했습니다.' + '</p>');
        } else {
          console.log(error);
        }
        App.loadRealEstates();
      });
    })
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });

  //buyModal 띄어져 있으면
  $('#buyModal').on('show.bs.modal', function (e) {
    var id = $(e.relatedTarget).parent().find('.id').text();
    var temp_price = $(e.relatedTarget).parent().find('.price').text();
    //입력한 price ether => wei 로 변환한다.
    var price = web3.toWei(parseFloat(temp_price || 0), "ether");
    
    //id와 price 를 Modal의 hidden tag에 저장한다.
    $(e.currentTarget).find('#id').val(id);
    $(e.currentTarget).find('#price').val(price);
  });

  //buyerInfoModal 띄어져 있으면
  $('#buyerInfoModal').on('show.bs.modal', function (e) {
    var id = $(e.relatedTarget).parent().find('.id').text();
    
    App.contracts.RealEstate.deployed().then(function(instance){
      return instance.getBuyerInfo.call(id);
    }).then(function (buyerInfo) {
      $(e.currentTarget).find('#buyerAddress').text(buyerInfo[0]);
      $(e.currentTarget).find('#buyerName').text(web3.toUtf8(buyerInfo[1]));
      $(e.currentTarget).find('#buyerAge').text(buyerInfo[2]);
    }).catch(function (err) {
      console.log(err.message);
    })
  });
  
});
