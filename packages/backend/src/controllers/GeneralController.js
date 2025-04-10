import _ from 'lodash';
import config from '../configs/app';
import mongoose from 'mongoose';

class MainService {
  constructor(selectedModel, name) {
    this.selectedModel = selectedModel;
    this.name = name;
  }

  async getAll({
    page = 1,
    size = config.defaultLimit,
    query = {},
    populateKey,
  }) {
    try {
      let result;
      if (populateKey) {
        result = await this.selectedModel
          .find(query, null, {
            skip: (page - 1) * size,
            limit: parseInt(size, 10),
            sort: { createdAt: -1 },
          })
          .populate(populateKey);
      } else {
        result = await this.selectedModel.find(query, null, {
          skip: (page - 1) * size,
          limit: parseInt(size, 10),
          sort: { createdAt: -1 },
        });
      }

      const amount = await this.selectedModel.countDocuments(query);
      const payload = {
        rows: result,
        total: amount,
        currPage: page,
        totalPage: Math.floor(amount / size) + 1,
      };
      return payload;
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  }

  async aggregation({
    page = 1,
    size = config.defaultLimit,
    pipeline = [],
    lookupPipeline = [],
  }) {
    try {
      const allPipeline = pipeline;

      allPipeline.push({ $set: { id: '$_id' } });
      allPipeline.push({
        $facet: {
          count: [{ $count: 'total' }],
          data: [
            {
              $skip: +((size || config.pageLimit) * ((page || 1) - 1)),
            },
            {
              $limit: parseInt(size, 10) || config.pageLimit,
            },
            ...lookupPipeline,
          ],
        },
      });

      const result = await this.selectedModel.aggregate(allPipeline);
      const rows = result[0]?.data;
      const amount = result[0]?.count?.[0]?.total;

      const payload = {
        rows: rows,
        total: amount,
        currPage: page,
        totalPage: Math.floor(amount / size) + 1,
      };
      return payload;
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  }

  async getOne(id, populateKey = null) {
    try {
      let result;
      if (populateKey) {
        result = await this.selectedModel.findById(id).populate(populateKey);
      } else {
        result = await this.selectedModel.findById(id);
      }
      return result;
    } catch (error) {
      throw Error('DB_FALSE_READ Database fetching have problem', error);
    }
  }

  async getOneAggregate({ id = '', pipeline = [], lookupPipeline = [] }) {
    try {
      const allPipeline = [
        {
          $match: { _id: new mongoose.Types.ObjectId(id) },
        },
        ...pipeline,
        ...lookupPipeline,
      ];

      const result = await this.selectedModel.aggregate(allPipeline);
      const data = result[0];

      return data;
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  }

  async createOne(payload) {
    try {
      // eslint-disable-next-line new-cap
      const result = new this.selectedModel(payload);
      await result.save();
      return result;
    } catch (error) {
      throw Error(
        `DB_FALSE_CREATE Database creating ${this.name} have problem ${error.message}`,
      );
    }
  }

  async updateOne(id, payload) {
    try {
      const user = await this.selectedModel.findByIdAndUpdate(id, {
        $set: payload,
      });
      return user;
    } catch (error) {
      throw Error('DB_FALSE_EDIT Database Updating have problem', error);
    }
  }

  async deleteOne(id) {
    try {
      const user = await this.selectedModel.findByIdAndDelete(id);
      return user;
    } catch (error) {
      throw Error('DB_FALSE_DELETE Database creating have problem', error);
    }
  }
}

export default MainService;
