use order_by_gen::OrderByGen;

trait IntoOrderBy {
	type OrderParam;
	fn into_prisma_order(self, dir: prisma::SortOrder) -> Self::OrderParam;
}

struct QueryOrder<T>
where
	T: IntoOrderBy,
{
	dir: prisma::SortOrder,
	order: T,
}

impl<T> QueryOrder<T>
where
	T: IntoOrderBy,
{
	fn into_prisma(self) -> T::OrderParam {
		self.order.into_prisma_order(self.dir)
	}
}

#[derive(OrderByGen)]
#[prisma(module = "book_metadata")]
enum BookMetadataOrderBy {
	Title,
}

#[derive(OrderByGen)]
#[prisma(module = "books")]
enum BookOrderBy {
	Name,
	Path,
	Metadata(Vec<BookMetadataOrderBy>),
}

mod prisma {
	use std::fmt::Display;

	pub mod books {
		pub mod name {
			pub fn order(
				_dir: crate::prisma::SortOrder,
			) -> super::OrderByWithRelationParam {
				super::OrderByWithRelationParam::Name
			}
		}

		pub mod path {
			pub fn order(
				_dir: crate::prisma::SortOrder,
			) -> super::OrderByWithRelationParam {
				super::OrderByWithRelationParam::Path
			}
		}

		pub mod metadata {
			pub fn order(
				_params: Vec<crate::prisma::book_metadata::OrderByWithRelationParam>,
			) -> super::OrderByWithRelationParam {
				super::OrderByWithRelationParam::Metadata(
					crate::prisma::book_metadata::OrderByWithRelationParam::Title,
				)
			}
		}

		pub enum OrderByWithRelationParam {
			Name,
			Path,
			Metadata(crate::prisma::book_metadata::OrderByWithRelationParam),
		}
	}

	pub mod book_metadata {
		pub mod title {
			pub fn order(
				_dir: crate::prisma::SortOrder,
			) -> super::OrderByWithRelationParam {
				super::OrderByWithRelationParam::Title
			}
		}

		pub enum OrderByWithRelationParam {
			Title,
		}
	}

	#[derive(Debug, Clone, Copy)]
	pub enum SortOrder {
		Asc,
		Desc,
	}

	impl Display for SortOrder {
		fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
			match self {
				SortOrder::Asc => write!(f, "asc"),
				SortOrder::Desc => write!(f, "desc"),
			}
		}
	}
}

#[cfg(test)]
mod tests {
	use super::*;

	#[test]
	fn test_book_order_by_gen() {
		assert!(matches!(
			BookOrderBy::Name.into_prisma_order(prisma::SortOrder::Asc),
			prisma::books::OrderByWithRelationParam::Name
		));
		assert!(matches!(
			BookOrderBy::Path.into_prisma_order(prisma::SortOrder::Asc),
			prisma::books::OrderByWithRelationParam::Path
		));
		assert!(matches!(
			BookOrderBy::Metadata(vec![BookMetadataOrderBy::Title])
				.into_prisma_order(prisma::SortOrder::Asc),
			prisma::books::OrderByWithRelationParam::Metadata(
				prisma::book_metadata::OrderByWithRelationParam::Title
			)
		));
	}

	// #[test]
	// fn test_book_metadata_order_by_gen() {
	// 	assert_eq!(
	// 		BookMetadataOrderBy::Title.into_prisma_order(prisma::SortOrder::Asc),
	// 		"metadata::title::order(asc)"
	// 	);
	// 	assert_eq!(
	// 		BookMetadataOrderBy::Title.into_prisma_order(prisma::SortOrder::Desc),
	// 		"metadata::title::order(desc)"
	// 	);
	// }
}