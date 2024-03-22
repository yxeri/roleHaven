'use strict';
import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import app from '../../app';
import authenticateSchemas from './schemas/authentications';
import starterData from './testData/starter';
import baseObjectSchemas from './schemas/baseObjects';
chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);
describe('Authenticate', () => {
    it('Should get jwt token on /api/authenticate POST', (done) => {
        chai
            .request(app)
            .post('/api/authenticate')
            .send({ data: { user: starterData.moderatorUserTwo } })
            .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
            response.body.data.should.be.jsonSchema(authenticateSchemas.authenticate);
            done();
        });
    });
    it('Should NOT get jwt token with unverified user on /api/authenticate POST', (done) => {
        chai
            .request(app)
            .post('/api/authenticate')
            .send({ data: { user: starterData.unverifiedUser } })
            .end((error, response) => {
            response.should.have.status(401);
            response.should.be.json;
            response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
            done();
        });
    });
    it('Should NOT get jwt token with banned user on /api/authenticate POST', (done) => {
        chai
            .request(app)
            .post('/api/authenticate')
            .send({ data: { user: starterData.bannedUser } })
            .end((error, response) => {
            response.should.have.status(401);
            response.should.be.json;
            response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
            done();
        });
    });
    it('Should NOT get jwt token with non-existent user on /api/authenticate POST', (done) => {
        chai
            .request(app)
            .post('/api/authenticate')
            .send({ data: { user: starterData.nonExistingUser } })
            .end((error, response) => {
            response.should.have.status(404);
            response.should.be.json;
            response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
            done();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aGVudGljYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXV0aGVudGljYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLFlBQVksQ0FBQztBQUViLE9BQU8sSUFBSSxNQUFNLE1BQU0sQ0FBQztBQUN4QixPQUFPLFFBQVEsTUFBTSxXQUFXLENBQUM7QUFDakMsT0FBTyxRQUFRLE1BQU0sa0JBQWtCLENBQUM7QUFDeEMsT0FBTyxHQUFHLE1BQU0sV0FBVyxDQUFDO0FBQzVCLE9BQU8sbUJBQW1CLE1BQU0sMkJBQTJCLENBQUM7QUFDNUQsT0FBTyxXQUFXLE1BQU0sb0JBQW9CLENBQUM7QUFDN0MsT0FBTyxpQkFBaUIsTUFBTSx1QkFBdUIsQ0FBQztBQUV0RCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7QUFFZCxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ25CLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7QUFFbkIsUUFBUSxDQUFDLGNBQWMsRUFBRSxHQUFHLEVBQUU7SUFDNUIsRUFBRSxDQUFDLGdEQUFnRCxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7UUFDNUQsSUFBSTthQUNELE9BQU8sQ0FBQyxHQUFHLENBQUM7YUFDWixJQUFJLENBQUMsbUJBQW1CLENBQUM7YUFDekIsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLFdBQVcsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLENBQUM7YUFDdEQsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxFQUFFO1lBQ3ZCLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNqQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUM7WUFDeEIsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxpQkFB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