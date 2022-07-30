# Accountly

The starter template for kick-ass apps running on a MERN stack!

Check out a demo at https://www.accountly.com/.

## Up and Running Locally

### Setup MongoDB

You will first need an instance of MongoDB available for the backend api. The easiest way to accomplish that is to use Docker. You can run the following commands to run the latest version of MongoDB.

```
docker pull mongo
docker run -p 27017:27017 -d mongo
```

### Running the Projects

- Clone the repo
- In both the `frontend` and `backend` directories run `npm install`
- From the root of the project run `npm run start`

### Development

### TODO
- Site
    - Add Logo
    - Update Styles
- Settings
    - Add totals
    - Tabify Settings Page
    - Use Checkboxes
    - PayPeriods changed to an array
    - Format Currencies
    - Add date picker
    - Clear form after submit
    - Add Delete Button
        - Add Delete Confirmation
    - Show Error Messages
    - Validate data types
- Spending Plan
    - Add Budget List
- √ Persist Data
- Add postman routes for all models
- Partition models by user
- Deploy to production

    // "eslint-plugin-prettier": "^4.2.1",
    // "eslint-plugin-react": "^7.30.1"