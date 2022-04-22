import React, { useEffect, useState } from 'react'
import useSubscription from './Subcription'

const Loading = ({ loading }) => (loading ? <div className="app-loader">Please wait, we are loading something...</div> : null);
const Error = ({ error }) =>
  error ? (
    <section className="app-error">
      <h2>{error.name}</h2>
      <p>Error message : {error.message}</p>
      <p>Error code : {error.code}</p>
    </section>
  ) : null;
function SuscriptionApp() {
  const { 
    onClickAskUserPermission,
    onClickSusbribeToPushNotification,
    onClickSendSubscriptionToPushServer,
    onClickUnsubscribeUser,
    pushNotificationSupported,
    userSubscription,
    userConsent,
    error,
    loading } = useSubscription()

    const isConsentGranted = userConsent === "granted";
    const [newUserData, setUserData] = useState('')

    const getPushInfo = () => {
      const data = localStorage.getItem('push-info')
      if(data){
        setUserData(data)
      } else {
        setUserData(null)
      }
    }

    const unSubscribeHandler = () => {
      onClickUnsubscribeUser()
      setUserData('')
    }

    useEffect(()=> {
      getPushInfo()
    },[loading])

  return (
    <div>
      <Loading loading={loading} />
      <Error error={error} />
      <p>User consent is {userConsent}</p>
      {/* <button disabled={!pushNotificationSupported || isConsentGranted} onClick={onClickAskUserPermission}>
        {isConsentGranted ? "Consent granted" : " Ask user permission"}
      </button> */}

      {/* <button disabled={!pushNotificationSupported || !isConsentGranted || userSubscription} onClick={onClickSusbribeToPushNotification}>
        {userSubscription ? "Push subscription created" : "Create Notification subscription"}
      </button> */}

    {!newUserData ? 
      <button disabled={loading} onClick={onClickSendSubscriptionToPushServer}>
        Subscribe
      </button>  :
      <button disabled={loading} onClick={unSubscribeHandler}>
        Unsubscribe
      </button>
    }

      {/* {newId && (
        <div>
          <p>The server accepted the push subscrption!</p>
          <button onClick={onClickSendNotification}>Send a notification</button>
        </div>
      )} */}

      {/* <section>
        <h4>Your notification subscription details</h4>
        <pre>
          <code>{JSON.stringify(userSubscription, null, " ")}</code>
        </pre>
      </section> */}
    </div>
  )
}

export default SuscriptionApp