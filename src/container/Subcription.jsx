import axios from 'axios'
import React, {useState, useEffect} from 'react'
// import service from '../../sw';

function Subcription() {
  const applicationServerPublicKey = 'BMsFhyOx-CYwyDhQcQTw-vuWr3uco4SzQFc_0SbxC-8Gvs61cGKeKXbKOigSC8-vRnPdu0pMVtb08Wfs9EftrmM';
  const baseURL = 'https://push-notif-v1.herokuapp.com'
  let isSubscribed = false;
  // let swRegistration = null;

  const [textButton, setTextButton] = useState('Subscribe')
  const [swRegistration, setSwRegistration] = useState(null)
  const [subsText, setSubsText] = useState({})

  const urlB64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
  
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
  console.log('navigator', window)
  useEffect(()=> {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      console.log('Service Worker and Push is supported');
      // console.log('tae', navigator.serviceWorker.register(service))
      navigator.serviceWorker.register('./sw')
      .then(function(swReg) {
        // console.log('tae')
        // console.log('Service Worker is registered');
        console.log("swReg", swReg)
        setSwRegistration(swReg)
        initializeUI();
      })
      .catch(function(error) {
        // console.log('taeee')
        console.error('Service Worker Error', error);
      });
    } else {
      console.warn('Push messaging is not supported');
      // pushButton.textContent = 'Push Not Supported';
    }
  }, [])
  
  console.log("swRegistration", swRegistration)

  const initializeUI = () => {
    // return console.log('tae')
    // pushButton.disabled = true;
    if (isSubscribed) {
      unsubscribeUser();
    } else {
      subscribeUser();
    }
  
    // Set the initial subscription value
    swRegistration.pushManager.getSubscription()
    .then(function(subscription) {
      isSubscribed = !(subscription === null);
  
      updateSubscriptionOnServer(subscription);
  
      if (isSubscribed) {
        console.log('User IS subscribed.');
      } else {
        console.log('User is NOT subscribed.');
      }
      updateBtn();
    });
  }

  const updateBtn = () => {
    if (Notification.permission === 'denied') {
     setTextButton('Push Messaging Blocked.')
      // pushButton.disabled = true;
      updateSubscriptionOnServer(null);
      return;
    }
  
    if (isSubscribed) {
      setTextButton('Disable Push Messaging')
    } else {
      setTextButton('Enable Push Messaging')
    }
  
    // pushButton.disabled = false;
  }

  const subscribeUser = () => {
    const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
    swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    })
    .then(function(subscription) {
      console.log('User is subscribed.');
      //subscribe user
      sendSubscription(subscription)
      updateSubscriptionOnServer(subscription);
      // console.log('subscription', subscription)
  
      isSubscribed = true;
  
      updateBtn();
    })
    .catch(function(err) {
      console.log('Failed to subscribe the user: ', err);
      updateBtn();
    });
  }

  const updateSubscriptionOnServer = (subscription) => {
    // const subscriptionJson = document.querySelector('.js-subscription-json');
    // const subscriptionDetails =
    //   document.querySelector('.js-subscription-details');
  
    if (subscription) {
      const newSubs = JSON.stringify(subscription);
      console.log("subscription", newSubs)
      setSubsText(subscription)
      // subscriptionDetails.classList.remove('is-invisible');
    } else {
      // subscriptionDetails.classList.add('is-invisible');
    }
  }

  const unsubscribeUser = async() => {
    swRegistration.pushManager.getSubscription()
    .then(async(subscription) => {
      if (subscription) {
        const userId = JSON.parse(localStorage.getItem('push-info'))
        const server = `${baseURL}/archivesubscription/${userId._id}`
        const rawResponse = await fetch(server, {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        const content = await rawResponse.json();
        localStorage.clear()
        return subscription.unsubscribe();
      }
    })
    .catch(function(error) {
      console.log('Error unsubscribing', error);
    })
    .then(function() {
      updateSubscriptionOnServer(null);
  
      console.log('User is unsubscribed.');
      isSubscribed = false;
  
      updateBtn();
    });
  }

  const sendSubscription = async(subscription) => {
    const server = `${baseURL}/createsubscription`
    const rawResponse = await fetch(server, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({subscriptionKey:subscription})
    });
    const content = await rawResponse.json();
  
    const data = {
      _id: content.result._id,
      subscriptionKey: content.result.subscriptionKey
    }
    localStorage.setItem("push-info", JSON.stringify(data))
  }

  return (
    <div>
      <button onClick={initializeUI}>{textButton}</button>
      {/* <p>{subsText}</p> */}
    </div>
  )
}

export default Subcription