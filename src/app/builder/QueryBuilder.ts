import { FilterQuery, Query } from 'mongoose';

class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public query: Partial<Record<string, unknown>>;

  constructor(
    modelQuery: Query<T[], T>,
    query: Partial<Record<string, unknown>>,
  ) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  search(searchableFields: string[]) {
    const searchTerm = this.query?.searchTerm as string;
    if (searchTerm) {
      this.modelQuery = this.modelQuery.find({
        $or: searchableFields.map(
          (field) =>
            ({
              [field]: { $regex: searchTerm, $options: 'i' },
            }) as FilterQuery<T>,
        ),
      });
    }
    return this;
  }

  filter() {
    const queryObj = { ...this.query };
    const excludeFields = ['searchTerm', 'sort', 'limit', 'page', 'fields'];
    excludeFields.forEach((el) => delete queryObj[el]);

    const sanitize = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(sanitize);
      if (value && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
          if (k.startsWith('$')) continue;
          out[k] = sanitize(v);
        }
        return out;
      }
      return value;
    };

    this.modelQuery = this.modelQuery.find(
      sanitize(queryObj) as FilterQuery<T>,
    );

    return this;
  }

  sort() {
    const sortParam = this.query?.sort as string;

    if (sortParam) {
      const sortObj: Record<string, 1 | -1> = {};

      // Handle multiple sort fields
      sortParam.split(',').forEach((field) => {
        if (field.startsWith('-')) {
          sortObj[field.substring(1)] = -1; // Descending
        } else {
          sortObj[field] = 1; // Ascending
        }
      });

      this.modelQuery = this.modelQuery.sort(sortObj);
    } else {
      // Default sort
      this.modelQuery = this.modelQuery.sort({ createdAt: -1 });
    }

    return this;
  }

  paginate() {
    const page = Number(this.query?.page) || 1;
    const limit = Number(this.query?.limit) || 10;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    return this;
  }

  fields() {
    const fields =
      (this.query?.fields as string)?.split(',')?.join(' ') || '-__v';
    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }

  // ✅ Added `populate` method
  populate(field: string | string[]) {
    this.modelQuery = this.modelQuery.populate(field);
    return this;
  }

  async countTotal() {
    const total = await this.modelQuery.model.countDocuments(
      this.modelQuery.getFilter(),
    );
    const page = Number(this.query?.page) || 1;
    const limit = Number(this.query?.limit) || 10;
    const totalPage = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPage,
    };
  }
}

export default QueryBuilder;
