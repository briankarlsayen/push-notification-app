import React, {useState, useEffect} from 'react'
import axios from 'axios';
export default function Subcription() {
  const applicationServerPublicKey = 'BMsFhyOx-CYwyDhQcQTw-vuWr3uco4SzQFc_0SbxC-8Gvs61cGKeKXbKOigSC8-vRnPdu0pMVtb08Wfs9EftrmM';
  const baseURL = 'https://push-notif-v1.herokuapp.com'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [userConsent, setUserConsent] = useState(Notification.permission)
  const [userSubscription, setUserSubscription] = useState(null);

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

  const registerSW = () => {
    return navigator.serviceWorker.register('sw')
  }

  const isPushNotifSupported = () => {
    // console.log('Service Worker and Push is supported'); 
    return "serviceWorker" in navigator && "PushManager" in window;
  }

  const pushNotificationSupported = isPushNotifSupported();

  const getUserSubscription = async() => {
    return navigator.serviceWorker.ready
    .then(function(serviceWorker) {
      return serviceWorker.pushManager.getSubscription();
    })
    .then(function(pushSubscription) {
      return pushSubscription;
    });
  }

  const userSubscribe = async() => {
    return navigator.serviceWorker.ready
    .then(function(serviceWorker) {
      return serviceWorker.pushManager.getSubscription()
       .then(function(subscription) {
        return subscription.unsubscribe().then(function(successful) {
          // setLoading(true);
          localStorage.clear()
          setUserSubscription(null)
          // setLoading(false);
          setError(false)
          return successful
          // You've successfully unsubscribed
        }).catch(function(e) {
          setError({
            name: "Subscription error",
            message: "Unable to unsubscribe user",
            code: 0
          });
          return false
          // Unsubscribing failed
        })
      })
    })
  }

  async function askUserPermission() {
    return await Notification.requestPermission();
  }

  async function createNotificationSubscription() {
    //wait for service worker installation to be ready
    const serviceWorker = await navigator.serviceWorker.ready;
    // subscribe and return the subscription
    const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
    return await serviceWorker.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    });
  }


  useEffect(()=> {
    if(isPushNotifSupported) {
      registerSW().then(()=>{
        setLoading(false)
      })
    } else {
      console.log('Push messaging is not supported');
      setError({
        name: "Push messaging is not supported",
        message: "Push messaging is not supported",
        code: 0
      });
      // pushButton.textContent = 'Push Not Supported';
    }
  }, [])

  useEffect(() => {
    setLoading(true);
    setError(false);
    if(userConsent) onClickAskUserPermission()
    const getExixtingSubscription = async () => {
      const existingSubscription = await getUserSubscription();
      setUserSubscription(existingSubscription);
      setLoading(false);
    };
    getExixtingSubscription();
  }, []);

  const onClickAskUserPermission = () => {
    setLoading(true);
    setError(false);
    askUserPermission().then(consent => {
      setUserConsent(consent);
      if (consent !== "granted") {
        setError({
          name: "Consent denied",
          message: "You denied the consent to receive notifications",
          code: 0
        });
      }
      setLoading(false);
    });
  };


  const onClickSusbribeToPushNotification = () => {
    setLoading(true);
    setError(false);
    createNotificationSubscription()
      .then(function(subscrition) {
        setUserSubscription(subscrition);
        setLoading(false);
      })
      .catch(err => {
        console.log("Unable to create notification subscription")
        // console.error("Couldn't create the notification subscription", err, "name:", err.name, "message:", err.message, "code:", err.code);
        setError(err);
        setLoading(false);
      });
  };

  const sendSubscribeUserToServer = async(props) => {
    setLoading(true)
    const subKey = props !== null ? props : userSubscription
    const server = `${baseURL}/createsubscription`
    const createSubs = await axios.post(server, {subscriptionKey: subKey})
    console.log(createSubs)
    if(createSubs.statusText === 'OK') {
      setLoading(false);
      const data = {
        _id: createSubs.data.result._id,
        subscriptionKey: createSubs.data.result.subscriptionKey
      }
      localStorage.setItem("push-info", JSON.stringify(data))
    } else {
      setLoading(false);
      setError({
        name: "Subscription denied",
        message: "Unable to create subscription",
        code: 0
      });
    }
  }

  const onClickSendSubscriptionToPushServer = async() => {
    setLoading(true);
    setError(false);
    if(!userSubscription){
      await createNotificationSubscription()
      .then(function(subscrition) {
        setUserSubscription(subscrition);
        sendSubscribeUserToServer(subscrition)
      })
      .catch(err => {
        // console.error("Couldn't create the notification subscription", err, "name:", err.name, "message:", err.message, "code:", err.code);
        setError({
          name: "Push subscription denied",
          message: "Unable to create push subscription",
          code: 0
        });
        setLoading(false);
      });
    } else {
      sendSubscribeUserToServer(null)
    }
  };

  const onClickUnsubscribeUser = async() => {    
    setError(false);
    setLoading(true)
    const userId = JSON.parse(localStorage.getItem('push-info'))
    const server = `${baseURL}/archivesubscription/${userId._id}`
    const archiveSubscription = await axios.put(server)
    if(archiveSubscription.statusText === 'OK') {
      const check = await userSubscribe()
      console.log('check', check)
      if(check) {
        setLoading(false);
      }
    } else {
      setLoading(false);
      setError({
        name: "Subscription denied",
        message: "Unable to end subscription",
        code: 0
      });
    }
  }

  return {
    onClickAskUserPermission,
    onClickSusbribeToPushNotification,
    onClickSendSubscriptionToPushServer,
    onClickUnsubscribeUser,
    pushNotificationSupported,
    userSubscription,
    userConsent,
    error,
    loading
  };
}