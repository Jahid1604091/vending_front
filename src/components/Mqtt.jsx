import React, { useEffect, useState } from 'react'

const Mqtt = () => {
        const [client, setClient] = useState(null);
        const [messages, setMessages] = useState([]);

      useEffect(() => {
        const mqtt = require('mqtt');
        const client = mqtt.connect(`mqtt://${process.env.REACT_APP_MQTT_HOST}:${process.env.REACT_APP_MQTT_PORT}`);

        client.on('connect', () => {
          console.log('Connected to MQTT broker');
          client.subscribe(process.env.REACT_APP_MQTT_TOPIC_CARD_RESPONSE, (err) => {
            if (err) {
              console.error('Subscription error:', err);
            }
          });
        });

        client.on('message', (topic, message) => {
          console.log('Received message:', topic, message.toString());
          setMessages((prevMessages) => [...prevMessages, message.toString()]);
        });

        setClient(client);

        return () => {
          client.end();
        };
      }, []);

  return (
    <div>
      
    </div>
  )
}

export default Mqtt
